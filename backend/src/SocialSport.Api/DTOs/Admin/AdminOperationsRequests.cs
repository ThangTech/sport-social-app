using System.ComponentModel.DataAnnotations;
using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.DTOs.Admin;

public record CreateOperationalTaskRequest(
    [property: Required, MaxLength(200)] string Title,
    [property: MaxLength(3000)] string? Description,
    [property: MaxLength(10000)] string? Procedure,
    OperationalPriority Priority,
    Guid? AssignedTo,
    DateTimeOffset? DueAt);

public record UpdateOperationalTaskRequest(OperationalTaskStatus Status, Guid? AssignedTo, DateTimeOffset? DueAt);

public record CreateChangeRequest(
    [property: Required, MaxLength(200)] string Title,
    [property: Required, MaxLength(4000)] string Description,
    [property: Required, MaxLength(12000)] string ImplementationPlan,
    [property: Required, MaxLength(12000)] string RollbackPlan,
    [property: Required, RegularExpression("low|medium|high|critical")] string RiskLevel,
    DateTimeOffset? ScheduledAt);

public record UpdateChangeStatusRequest(ChangeRequestStatus Status);

public record CreateIncidentRequest(
    [property: Required, MaxLength(200)] string Title,
    [property: Required, MaxLength(4000)] string Summary,
    [property: MaxLength(4000)] string? Impact,
    IncidentSeverity Severity,
    Guid? OwnerId);

public record UpdateIncidentRequest(IncidentStatus Status, Guid? OwnerId, [property: MaxLength(12000)] string? ResponseNotes, [property: MaxLength(6000)] string? RootCause);

public record SaveContingencyPlanRequest(
    [property: Required, MaxLength(200)] string Name,
    [property: Required, MaxLength(6000)] string TriggerConditions,
    [property: Required, MaxLength(12000)] string ResponseSteps,
    [property: Required, MaxLength(12000)] string RecoverySteps,
    [property: Required, MaxLength(200)] string Owner,
    bool IsActive);
