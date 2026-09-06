using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Domain.Entities;
using SocialSport.Infrastructure.Identity;

namespace SocialSport.Infrastructure.Persistence.Configurations;

public class RefreshTokenConfiguration
    : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TokenHash)
            .HasMaxLength(500)
            .IsRequired();

        builder.HasIndex(x => x.TokenHash)
            .IsUnique();

        builder.HasIndex(x => new
        {
            x.UserId,
            x.ExpiresAt
        });

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}