namespace SocialSport.Api.Settings;

public class CopyrightScanningSettings
{
    public const string SectionName = "CopyrightScanning";

    public int AppealWindowDays { get; set; } = 14;

    public int PerceptualHashDistanceThreshold { get; set; } = 10;

    public AcrCloudSettings AcrCloud { get; set; } = new();

    public GoogleVisionSettings GoogleVision { get; set; } = new();
}

public class AcrCloudSettings
{
    public bool Enabled { get; set; }

    public string Host { get; set; } = string.Empty;

    public string AccessKey { get; set; } = string.Empty;

    public string AccessSecret { get; set; } = string.Empty;

    public int MaxSampleBytes { get; set; } = 5 * 1024 * 1024;
}

public class GoogleVisionSettings
{
    public bool Enabled { get; set; }

    public string ApiKey { get; set; } = string.Empty;

    public string Endpoint { get; set; } =
        "https://vision.googleapis.com/";

    public int MaxResults { get; set; } = 10;
}
