namespace SocialSport.Api.Settings;

public static class LocalEnvironmentFile
{
    public static IReadOnlyDictionary<string, string> Load()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var path = new[]
        {
            Path.Combine(currentDirectory, ".env"),
            Path.Combine(
                currentDirectory,
                "src",
                "SocialSport.Api",
                ".env"),
            Path.Combine(AppContext.BaseDirectory, ".env"),
            Path.GetFullPath(
                Path.Combine(
                    AppContext.BaseDirectory,
                    "..",
                    "..",
                    "..",
                    ".env"))
        }.FirstOrDefault(File.Exists);
        if (path is null)
        {
            return new Dictionary<string, string>(
                StringComparer.OrdinalIgnoreCase);
        }

        var values = new Dictionary<string, string>(
            StringComparer.OrdinalIgnoreCase);
        foreach (var rawLine in File.ReadLines(path))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            var separator = line.IndexOf('=');
            if (separator <= 0)
            {
                continue;
            }

            var key = line[..separator].Trim();
            var value = line[(separator + 1)..].Trim();
            if (value.Length >= 2
                && ((value.StartsWith('"') && value.EndsWith('"'))
                    || (value.StartsWith('\'') && value.EndsWith('\''))))
            {
                value = value[1..^1];
            }

            values[key] = value;
        }

        return values;
    }

    public static string? Get(
        this IReadOnlyDictionary<string, string> values,
        string key)
    {
        var processValue = Environment.GetEnvironmentVariable(key);
        if (!string.IsNullOrWhiteSpace(processValue))
        {
            return processValue;
        }

        return values.GetValueOrDefault(key);
    }
}
