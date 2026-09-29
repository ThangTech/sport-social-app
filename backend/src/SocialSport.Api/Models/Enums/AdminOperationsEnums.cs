namespace SocialSport.Api.Models.Enums;

public enum OperationalTaskStatus
{
    Open = 1,
    InProgress = 2,
    Blocked = 3,
    Completed = 4
}

public enum OperationalPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum ChangeRequestStatus
{
    Draft = 1,
    Approved = 2,
    InProgress = 3,
    Completed = 4,
    Failed = 5,
    RolledBack = 6
}

public enum IncidentSeverity
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum IncidentStatus
{
    Open = 1,
    Investigating = 2,
    Contained = 3,
    Resolved = 4
}
