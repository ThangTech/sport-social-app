using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Api.Models.Entities;

namespace SocialSport.Api.Data.Configurations;

public class ExternalCopyrightScanConfiguration
    : IEntityTypeConfiguration<ExternalCopyrightScan>
{
    public void Configure(EntityTypeBuilder<ExternalCopyrightScan> builder)
    {
        builder.ToTable("ExternalCopyrightScans");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Provider).HasMaxLength(40);
        builder.Property(x => x.Status).HasConversion<int>();
        builder.Property(x => x.ExternalJobId).HasMaxLength(200);
        builder.Property(x => x.MatchSummary).HasMaxLength(2000);
        builder.Property(x => x.ErrorMessage).HasMaxLength(2000);
        builder.Property(x => x.ReviewNotes).HasMaxLength(3000);
        builder
            .HasOne(x => x.PostMedia)
            .WithMany()
            .HasForeignKey(x => x.PostMediaId)
            .OnDelete(DeleteBehavior.Cascade);
        builder
            .HasIndex(x => new { x.PostMediaId, x.Provider })
            .IsUnique();
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
    }
}
