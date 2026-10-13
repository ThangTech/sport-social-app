using Microsoft.ML.OnnxRuntime;
using System.Text.Json;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace SocialSport.Api.Services.Implementations;

public record LogoDetection(string Label, float Confidence, float[] Bbox);
public record LogoAnalysis(
    string Status,
    string Message,
    int Width,
    int Height,
    IReadOnlyList<LogoDetection> Data);

// Supports YOLOv5 and YOLOv8 detection exports without embedded NMS.
// A logo is a review hint, never a determination of copyright infringement.
public sealed class LocalLogoDetector : IDisposable
{
    private readonly Lazy<InferenceSession?> _session;
    private readonly string[] _labels;
    private readonly bool _isYoloV5;
    private readonly ILogger<LocalLogoDetector> _logger;
    private readonly SemaphoreSlim _gate = new(1);
    private const int Size = 640;
    private const float ConfidenceThreshold = .35f;
    private const float OverlapThreshold = .45f;
    public LocalLogoDetector(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        ILogger<LocalLogoDetector> logger)
    {
        _logger = logger;
        _labels = configuration.GetSection("LogoDetection:Labels").Get<string[]>() ?? [];
        var format = configuration["LogoDetection:OutputFormat"] ?? "YoloV5";
        if (format != "YoloV5" && format != "YoloV8")
        {
            throw new InvalidOperationException("LogoDetection:OutputFormat must be YoloV5 or YoloV8.");
        }
        _isYoloV5 = format == "YoloV5";
        var modelPath = configuration["LogoDetection:ModelPath"] ?? "Models/brand-logos-yolov5s.onnx";
        var path = Path.Combine(environment.ContentRootPath, modelPath);
        _session = new(() => CreateSession(path));
    }

    private InferenceSession? CreateSession(string path)
    {
        if (!File.Exists(path) || _labels.Length == 0)
        {
            _logger.LogWarning("Logo model or labels missing at {ModelPath}", path);
            return null;
        }

        using var options = new Microsoft.ML.OnnxRuntime.SessionOptions
        {
            IntraOpNumThreads = 2,
            InterOpNumThreads = 1
        };
        var session = new InferenceSession(path, options);
        if (_isYoloV5 && session.ModelMetadata.CustomMetadataMap.TryGetValue("names", out var names))
        {
            try
            {
                var modelLabels = JsonSerializer.Deserialize<string[]>(names);
                if (modelLabels is null || !modelLabels.SequenceEqual(_labels))
                {
                    throw new InvalidOperationException("Configured logo labels differ from model metadata.");
                }
            }
            catch
            {
                session.Dispose();
                throw;
            }
        }
        return session;
    }

    public async Task<LogoAnalysis> AnalyzeAsync(
        string path,
        bool isImage,
        CancellationToken cancellationToken = default)
    {
        if (!isImage)
        {
            return new("manual", "Video cần được quản trị viên xem thủ công.", 0, 0, []);
        }
        await _gate.WaitAsync(cancellationToken);
        try
        {
            var session = _session.Value;
            if (session is null)
            {
                return new("unavailable", "Chưa có model logo và danh sách nhãn. Cần xem ảnh thủ công.", 0, 0, []);
            }
            var input = session.InputMetadata.Single();
            if (!input.Value.Dimensions.SequenceEqual(new[] { 1, 3, Size, Size }))
            {
                throw new InvalidOperationException("Unsupported YOLO input shape.");
            }
            var info = await Image.IdentifyAsync(path, cancellationToken);
            if ((long)info.Width * info.Height > 40_000_000)
            {
                return new("manual", "Ảnh quá lớn để phân tích tự động. Cần xem thủ công.", info.Width, info.Height, []);
            }
            using var source = await Image.LoadAsync<Rgb24>(path, cancellationToken);
            source.Mutate(x => x.AutoOrient());
            var width = source.Width;
            var height = source.Height;
            var scale = Math.Min((float)Size / width, (float)Size / height);
            var resizedWidth = Math.Max(1, (int)Math.Round(width * scale));
            var resizedHeight = Math.Max(1, (int)Math.Round(height * scale));
            var left = (Size - resizedWidth) / 2;
            var top = (Size - resizedHeight) / 2;
            source.Mutate(x => x.Resize(resizedWidth, resizedHeight));
            using var canvas = new Image<Rgb24>(Size, Size, new Rgb24(114, 114, 114));
            canvas.Mutate(x => x.DrawImage(source, new Point(left, top), 1));
            var pixels = new float[3 * Size * Size];
            canvas.ProcessPixelRows(accessor =>
            {
                for (var y = 0; y < Size; y++)
                {
                    var row = accessor.GetRowSpan(y);
                    for (var x = 0; x < Size; x++)
                    {
                        var offset = y * Size + x;
                        pixels[offset] = row[x].R / 255f;
                        pixels[Size * Size + offset] = row[x].G / 255f;
                        pixels[2 * Size * Size + offset] = row[x].B / 255f;
                    }
                }
            });
            using var tensor = OrtValue.CreateTensorValueFromMemory(pixels, new long[] { 1, 3, Size, Size });
            using var options = new RunOptions();
            var inputs = new Dictionary<string, OrtValue> { [input.Key] = tensor };
            using var output = session.Run(options, inputs, session.OutputNames);
            var shape = output[0].GetTensorTypeAndShape().Shape;
            var channels = _labels.Length + (_isYoloV5 ? 5 : 4);
            var channelAxis = _isYoloV5 ? 2 : 1;
            if (shape.Length != 3 || shape[0] != 1 || shape[channelAxis] != channels)
            {
                throw new InvalidOperationException("Unsupported YOLO output shape or labels.");
            }
            var anchors = (int)shape[_isYoloV5 ? 1 : 2];
            var values = output[0].GetTensorDataAsSpan<float>().ToArray();
            var detections = Decode(
                values, anchors, _labels, width, height, scale, left, top, _isYoloV5);
            var message = detections.Count == 0
                ? $"Không phát hiện logo thuộc {_labels.Length} nhãn của model ở ngưỡng hiện tại. Vẫn cần duyệt nội dung ảnh."
                : "Kết quả hỗ trợ duyệt; không kết luận vi phạm bản quyền.";
            return new("analyzed", message, width, height, detections);
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Local logo analysis failed; manual review required");
            return new("failed", "Không thể phân tích ảnh. Cần xem thủ công.", 0, 0, []);
        }
        finally
        {
            _gate.Release();
        }
    }

    public static List<LogoDetection> Decode(
        float[] values,
        int anchors,
        string[] labels,
        int width,
        int height,
        float scale,
        int left,
        int top,
        bool isYoloV5 = false)
    {
        var channels = labels.Length + (isYoloV5 ? 5 : 4);
        if (anchors <= 0 || labels.Length == 0 || values.LongLength != (long)anchors * channels)
        {
            throw new ArgumentException("YOLO output does not match the configured labels and layout.");
        }
        if (!float.IsFinite(scale) || scale <= 0 || width <= 0 || height <= 0)
        {
            throw new ArgumentException("Image dimensions and scale must be positive.");
        }

        var candidates = new List<LogoDetection>();
        for (var i = 0; i < anchors; i++)
        {
            var offset = i * channels;
            var objectness = isYoloV5 ? values[offset + 4] : 1f;
            if (!float.IsFinite(objectness) || objectness < ConfidenceThreshold || objectness > 1)
            {
                continue;
            }
            var label = 0;
            var score = 0f;
            for (var c = 0; c < labels.Length; c++)
            {
                var classScore = isYoloV5
                    ? values[offset + 5 + c]
                    : values[(c + 4) * anchors + i];
                if (!float.IsFinite(classScore) || classScore < 0 || classScore > 1)
                {
                    continue;
                }
                var confidence = objectness * classScore;
                if (confidence > score)
                {
                    score = confidence;
                    label = c;
                }
            }

            if (!float.IsFinite(score) || score < ConfidenceThreshold)
            {
                continue;
            }

            var x = isYoloV5 ? values[offset] : values[i];
            var y = isYoloV5 ? values[offset + 1] : values[anchors + i];
            var w = isYoloV5 ? values[offset + 2] : values[2 * anchors + i];
            var h = isYoloV5 ? values[offset + 3] : values[3 * anchors + i];
            if (!float.IsFinite(x) || !float.IsFinite(y)
                || !float.IsFinite(w) || !float.IsFinite(h) || w <= 0 || h <= 0)
            {
                continue;
            }
            float[] box =
            [
                Math.Clamp((x - w / 2 - left) / scale, 0, width),
                Math.Clamp((y - h / 2 - top) / scale, 0, height),
                Math.Clamp((x + w / 2 - left) / scale, 0, width),
                Math.Clamp((y + h / 2 - top) / scale, 0, height)
            ];
            if (box.Any(v => !float.IsFinite(v)) || box[2] <= box[0] || box[3] <= box[1])
            {
                continue;
            }
            candidates.Add(new(labels[label], score, box));
        }
        var kept = new List<LogoDetection>();
        foreach (var candidate in candidates.OrderByDescending(x => x.Confidence).Take(3000))
        {
            var overlaps = kept.Any(x =>
                x.Label == candidate.Label
                && IntersectionOverUnion(x.Bbox, candidate.Bbox) > OverlapThreshold);
            if (overlaps)
            {
                continue;
            }
            kept.Add(candidate);
            if (kept.Count == 100)
            {
                break;
            }
        }
        return kept;
    }
    private static float IntersectionOverUnion(float[] a, float[] b)
    {
        var overlapWidth = Math.Max(0, Math.Min(a[2], b[2]) - Math.Max(a[0], b[0]));
        var overlapHeight = Math.Max(0, Math.Min(a[3], b[3]) - Math.Max(a[1], b[1]));
        var intersection = overlapWidth * overlapHeight;
        var areaA = (a[2] - a[0]) * (a[3] - a[1]);
        var areaB = (b[2] - b[0]) * (b[3] - b[1]);
        return intersection / (areaA + areaB - intersection);
    }

    public void Dispose()
    {
        if (_session.IsValueCreated)
        {
            _session.Value?.Dispose();
        }
        _gate.Dispose();
    }
}
