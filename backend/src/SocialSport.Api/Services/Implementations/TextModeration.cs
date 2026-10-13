using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace SocialSport.Api.Services.Implementations;

public sealed class TextModeration
{
    private readonly HashSet<string> _terms;
    private readonly int _maxWords;
    public TextModeration(IWebHostEnvironment environment, IConfiguration configuration)
    {
        var path = Path.Combine(environment.ContentRootPath, "Data", "Moderation", "sensitive-words.json");
        var words = JsonSerializer.Deserialize<string[]>(File.ReadAllText(path)) ?? [];
        var additionalTerms = configuration
            .GetSection("CommentModeration:BlockedTerms")
            .Get<string[]>() ?? [];
        _terms = words.Concat(additionalTerms)
            .Select(Normalize)
            .Where(x => x.Length > 0)
            .ToHashSet(StringComparer.Ordinal);
        _maxWords = _terms.Select(x => x.Split(' ').Length).DefaultIfEmpty(1).Max();
    }

    public static string Normalize(string value)
    {
        var normalized = value.Normalize(NormalizationForm.FormKC).ToLowerInvariant();
        var visibleText = Regex.Replace(normalized, @"\p{Cf}", "");
        return Regex.Replace(visibleText, @"[^\p{L}\p{N}]+", " ").Trim();
    }

    public void EnsureAllowed(string? content)
    {
        var words = Normalize(content ?? "").Split(' ', StringSplitOptions.RemoveEmptyEntries);
        for (var start = 0; start < words.Length; start++)
        {
            var remainingWords = Math.Min(_maxWords, words.Length - start);
            for (var length = 1; length <= remainingWords; length++)
            {
                var phrase = string.Join(" ", words, start, length);
                if (_terms.Contains(phrase))
                {
                    throw new InvalidOperationException(
                        "Nội dung chứa ngôn từ không phù hợp. Vui lòng chỉnh sửa trước khi gửi.");
                }
            }
        }
    }
}
