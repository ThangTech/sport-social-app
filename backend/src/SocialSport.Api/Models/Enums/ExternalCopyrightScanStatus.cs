namespace SocialSport.Api.Models.Enums;

public enum ExternalCopyrightScanStatus
{
    Processing = 1,
    Clear = 2,
    ReviewRequired = 3,
    ClearedByAdmin = 4,
    ViolationConfirmed = 5,
    Failed = 6,
    Appealed = 7,
    AppealAccepted = 8,
    AppealRejected = 9
}
