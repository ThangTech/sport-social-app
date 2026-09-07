using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Identity;

namespace SocialSport.Api.Data.Configurations;

public class DeviceTokenConfiguration
    : IEntityTypeConfiguration<DeviceToken>
{
    public void Configure(EntityTypeBuilder<DeviceToken> builder)
    {
        builder.ToTable("DeviceTokens");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.ExpoPushToken)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(x => x.Platform)
            .HasMaxLength(20)
            .IsRequired();

        builder.HasIndex(x => x.ExpoPushToken)
            .IsUnique();

        builder.HasIndex(x => x.UserId);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}