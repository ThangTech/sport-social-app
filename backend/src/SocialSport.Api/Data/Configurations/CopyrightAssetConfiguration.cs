using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Data.Configurations;

public class CopyrightAssetConfiguration : IEntityTypeConfiguration<CopyrightAsset>
{
    public void Configure(EntityTypeBuilder<CopyrightAsset> builder)
    {
        builder.ToTable("CopyrightAssets");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(300).IsRequired();
        builder.Property(x => x.RightsOwnerName).HasMaxLength(300).IsRequired();
        builder.Property(x => x.ContentHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.PerceptualHash).HasMaxLength(16);
        builder.Property(x => x.ReferencePath).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.EvidenceNotes).HasMaxLength(3000);
        builder.Property(x => x.MediaType).HasConversion<int>();
        builder.Property(x => x.Status).HasConversion<int>();
        builder.HasIndex(x => new { x.ContentHash, x.Status });
        builder.HasIndex(x => new { x.PerceptualHash, x.Status });
    }
}
