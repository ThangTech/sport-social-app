using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Data.Configurations;

public class OperationalTaskConfiguration : IEntityTypeConfiguration<OperationalTask>
{
    public void Configure(EntityTypeBuilder<OperationalTask> b)
    {
        b.ToTable("OperationalTasks"); b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(200).IsRequired(); b.Property(x => x.Description).HasMaxLength(3000); b.Property(x => x.Procedure).HasMaxLength(10000);
        b.Property(x => x.Status).HasConversion<int>(); b.Property(x => x.Priority).HasConversion<int>(); b.HasIndex(x => new { x.Status, x.DueAt });
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.AssignedTo).OnDelete(DeleteBehavior.Restrict);
    }
}

public class ChangeRequestConfiguration : IEntityTypeConfiguration<ChangeRequest>
{
    public void Configure(EntityTypeBuilder<ChangeRequest> b)
    {
        b.ToTable("ChangeRequests"); b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(200).IsRequired(); b.Property(x => x.Description).HasMaxLength(4000).IsRequired();
        b.Property(x => x.ImplementationPlan).HasMaxLength(12000).IsRequired(); b.Property(x => x.RollbackPlan).HasMaxLength(12000).IsRequired(); b.Property(x => x.RiskLevel).HasMaxLength(20).IsRequired();
        b.Property(x => x.Status).HasConversion<int>(); b.HasIndex(x => new { x.Status, x.ScheduledAt });
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.RequestedBy).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.ApprovedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class IncidentConfiguration : IEntityTypeConfiguration<Incident>
{
    public void Configure(EntityTypeBuilder<Incident> b)
    {
        b.ToTable("Incidents"); b.HasKey(x => x.Id); b.Property(x => x.Title).HasMaxLength(200).IsRequired(); b.Property(x => x.Summary).HasMaxLength(4000).IsRequired();
        b.Property(x => x.Impact).HasMaxLength(4000); b.Property(x => x.ResponseNotes).HasMaxLength(12000); b.Property(x => x.RootCause).HasMaxLength(6000);
        b.Property(x => x.Severity).HasConversion<int>(); b.Property(x => x.Status).HasConversion<int>(); b.HasIndex(x => new { x.Status, x.Severity, x.DetectedAt });
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict); b.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.OwnerId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class ContingencyPlanConfiguration : IEntityTypeConfiguration<ContingencyPlan>
{
    public void Configure(EntityTypeBuilder<ContingencyPlan> b)
    {
        b.ToTable("ContingencyPlans"); b.HasKey(x => x.Id); b.Property(x => x.Name).HasMaxLength(200).IsRequired(); b.Property(x => x.TriggerConditions).HasMaxLength(6000).IsRequired();
        b.Property(x => x.ResponseSteps).HasMaxLength(12000).IsRequired(); b.Property(x => x.RecoverySteps).HasMaxLength(12000).IsRequired(); b.Property(x => x.Owner).HasMaxLength(200).IsRequired();
        b.HasIndex(x => new { x.IsActive, x.Name }); b.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.CreatedBy).OnDelete(DeleteBehavior.Restrict);
    }
}

public class AdminAuditLogConfiguration : IEntityTypeConfiguration<AdminAuditLog>
{
    public void Configure(EntityTypeBuilder<AdminAuditLog> b)
    {
        b.ToTable("AdminAuditLogs"); b.HasKey(x => x.Id); b.Property(x => x.Action).HasMaxLength(100).IsRequired(); b.Property(x => x.TargetType).HasMaxLength(100).IsRequired();
        b.Property(x => x.TargetId).HasMaxLength(100); b.Property(x => x.Summary).HasMaxLength(1000).IsRequired(); b.HasIndex(x => x.CreatedAt);
        b.HasOne<ApplicationUser>().WithMany().HasForeignKey(x => x.ActorId).OnDelete(DeleteBehavior.Restrict);
    }
}
