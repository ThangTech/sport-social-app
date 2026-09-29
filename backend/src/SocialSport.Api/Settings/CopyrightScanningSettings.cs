namespace SocialSport.Api.Settings;

public class CopyrightScanningSettings
{
    public const string SectionName = "CopyrightScanning";

    public bool Enabled { get; set; }

    public bool FailClosed { get; set; } = true;

    public int AppealWindowDays { get; set; } = 14;

    public string Provider { get; set; } = "AcrCloud";

    public string ApiBaseUrl { get; set; } = string.Empty;

    public string BearerToken { get; set; } = string.Empty;

    public string ContainerId { get; set; } = string.Empty;
}
