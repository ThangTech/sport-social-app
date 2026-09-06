using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Domain.Entities;
using SocialSport.Infrastructure.Identity;

namespace SocialSport.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration
    : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type)
            .HasConversion<int>();

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.ActorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => new
        {
            x.UserId,
            x.IsRead,
            x.CreatedAt
        });
    }
}