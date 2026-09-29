using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Data.Configurations;
public class CopyrightCaseConfiguration : IEntityTypeConfiguration<CopyrightCase>
{
    public void Configure(EntityTypeBuilder<CopyrightCase> builder)
    {
        builder.ToTable("CopyrightCases"); builder.HasKey(x => x.Id);
        builder.Property(x => x.Status).HasConversion<int>(); builder.Property(x => x.Confidence).HasPrecision(5, 4);
        builder.Property(x => x.DecisionNotes).HasMaxLength(3000); builder.Property(x => x.AppealReason).HasMaxLength(3000);
        builder.HasOne(x => x.CopyrightAsset).WithMany().HasForeignKey(x => x.CopyrightAssetId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.PostMedia).WithMany().HasForeignKey(x => x.PostMediaId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(x => new { x.CopyrightAssetId, x.PostMediaId }).IsUnique(); builder.HasIndex(x => new { x.Status, x.CreatedAt });
    }
}
