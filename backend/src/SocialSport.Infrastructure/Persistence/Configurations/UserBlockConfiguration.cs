using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Domain.Entities;
using SocialSport.Infrastructure.Identity;

namespace SocialSport.Infrastructure.Persistence.Configurations;

public class UserBlockConfiguration
    : IEntityTypeConfiguration<UserBlock>
{
    public void Configure(EntityTypeBuilder<UserBlock> builder)
    {
        builder.ToTable("UserBlocks");

        builder.HasKey(x => new
        {
            x.BlockerId,
            x.BlockedId
        });

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.BlockerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.BlockedId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(x => x.BlockedId);
    }
}