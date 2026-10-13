using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;
using SocialSport.Api.Services.Implementations;

internal static class LogoChecks
{
    public static async Task RunAsync(
        LocalLogoDetector detector,
        IConfiguration configuration,
        IWebHostEnvironment environment,
        string temporaryDirectory,
        Action<bool, string> check)
    {
        CheckDecoding(check);

        var blankPath = Path.Combine(temporaryDirectory, "blank.png");
        using (var blank = new Image<Rgb24>(900, 300, Color.White))
        {
            await blank.SaveAsPngAsync(blankPath);
        }
        var empty = await detector.AnalyzeAsync(blankPath, true);
        check(empty.Status == "analyzed" && empty.Data.Count == 0,
            "Real ONNX inference: blank landscape image has no logo");
        check(empty.Width == 900 && empty.Height == 300,
            "Analysis preserves original image dimensions");

        var fixturePath = Path.Combine(AppContext.BaseDirectory, "Fixtures", "nike.jpg");
        var analysis = await detector.AnalyzeAsync(fixturePath, true);
        check(analysis.Status == "analyzed", "Trained logo model runs through .NET ONNX Runtime");
        var nike = analysis.Data.FirstOrDefault(item => item.Label == "Nike");
        check(nike is not null && nike.Confidence >= .35f,
            "Real photo: Nike detected with correct class mapping");
        // Source annotation: center=(.84453125,.70859375), size=(.2296875,.084375).
        check(nike is not null && Overlap(nike.Bbox, [467, 426.5f, 614, 480.5f]) > .5f,
            "Real photo: Nike box overlaps the annotated logo");
        Console.WriteLine($"Nike inference: {System.Text.Json.JsonSerializer.Serialize(analysis)}");

        var simultaneous = await Task.WhenAll(
            detector.AnalyzeAsync(fixturePath, true),
            detector.AnalyzeAsync(blankPath, true));
        check(simultaneous.All(result => result.Status == "analyzed"),
            "Concurrent uploads safely share one inference session");

        var video = await detector.AnalyzeAsync("unused", false);
        check(video.Status == "manual", "Video still requires manual review");

        var invalidImage = Path.Combine(temporaryDirectory, "invalid.jpg");
        await File.WriteAllTextAsync(invalidImage, "This is not an image.");
        var invalid = await detector.AnalyzeAsync(invalidImage, true);
        check(invalid.Status == "failed", "Invalid image is explicitly marked for manual review");

        using var missingDetector = CreateDetector(
            configuration, environment, Path.Combine(temporaryDirectory, "missing.onnx"));
        var missing = await missingDetector.AnalyzeAsync(fixturePath, true);
        check(missing.Status == "unavailable", "Missing model never reports a successful scan");

        using var corruptDetector = CreateDetector(configuration, environment, invalidImage);
        var corrupt = await corruptDetector.AnalyzeAsync(fixturePath, true);
        check(corrupt.Status == "failed", "Corrupt model safely falls back to manual review");

        var wrongLabels = new ConfigurationBuilder()
            .AddConfiguration(configuration)
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["LogoDetection:Labels:0"] = "Wrong brand"
            })
            .Build();
        using var wrongLabelDetector = new LocalLogoDetector(
            wrongLabels, environment, NullLogger<LocalLogoDetector>.Instance);
        var mismatched = await wrongLabelDetector.AnalyzeAsync(fixturePath, true);
        check(mismatched.Status == "failed", "Wrong class ordering cannot silently mislabel brands");

        using var cancelled = new CancellationTokenSource();
        cancelled.Cancel();
        try
        {
            await detector.AnalyzeAsync(fixturePath, true, cancelled.Token);
            check(false, "Cancelled analysis should stop");
        }
        catch (OperationCanceledException)
        {
            check(true, "Cancelled analysis stops without reporting success");
        }
    }

    private static LocalLogoDetector CreateDetector(
        IConfiguration configuration,
        IWebHostEnvironment environment,
        string modelPath)
    {
        var settings = new ConfigurationBuilder()
            .AddConfiguration(configuration)
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["LogoDetection:ModelPath"] = modelPath
            })
            .Build();
        return new LocalLogoDetector(settings, environment, NullLogger<LocalLogoDetector>.Instance);
    }

    private static void CheckDecoding(Action<bool, string> check)
    {
        // YOLOv5: cx, cy, w, h, objectness, Nike score, Adidas score.
        float[] values =
        [
            320, 320, 160, 80, .8f, .9f, .1f,
            321, 321, 160, 80, .7f, .9f, .1f,
            320, 320, 160, 80, .8f, .1f, .9f,
            100, 100, 40, 40, .4f, .8f, .1f,
            float.PositiveInfinity, 100, 40, 40, .9f, .9f, .1f
        ];
        var result = LocalLogoDetector.Decode(
            values, 5, ["Nike", "Adidas"], 1280, 720, .5f, 0, 140, true);
        check(result.Count == 2, "YOLOv5 NMS keeps different brands and rejects low scores/invalid boxes");
        check(Math.Abs(result[0].Confidence - .72f) < .00001f,
            "YOLOv5 confidence multiplies objectness by class probability");
        check(result[0].Bbox.SequenceEqual(new float[] { 480, 280, 800, 440 }),
            "YOLOv5 reverses landscape letterboxing");

        float[] portraitValues = [320, 320, 160, 80, .9f, .9f];
        var portrait = LocalLogoDetector.Decode(
            portraitValues, 1, ["Nike"], 720, 1280, .5f, 140, 0, true);
        check(portrait[0].Bbox.SequenceEqual(new float[] { 200, 560, 520, 720 }),
            "YOLOv5 reverses portrait letterboxing");

        try
        {
            LocalLogoDetector.Decode(values, 5, ["Wrong label count"], 640, 640, 1, 0, 0, true);
            check(false, "Mismatched labels should be rejected");
        }
        catch (ArgumentException)
        {
            check(true, "Mismatched output and labels are rejected");
        }
    }

    private static float Overlap(float[] actual, float[] expected)
    {
        var width = Math.Max(0, Math.Min(actual[2], expected[2]) - Math.Max(actual[0], expected[0]));
        var height = Math.Max(0, Math.Min(actual[3], expected[3]) - Math.Max(actual[1], expected[1]));
        var intersection = width * height;
        var areaActual = (actual[2] - actual[0]) * (actual[3] - actual[1]);
        var areaExpected = (expected[2] - expected[0]) * (expected[3] - expected[1]);
        return intersection / (areaActual + areaExpected - intersection);
    }
}
