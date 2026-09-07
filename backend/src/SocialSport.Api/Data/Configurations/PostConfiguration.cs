using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Identity;

namespace SocialSport.Api.Data.Configurations;

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.ToTable("Posts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Content)
            .HasMaxLength(5000);

        builder.Property(x => x.Visibility)
            .HasConversion<int>();

        builder.Property(x => x.Status)
            .HasConversion<int>();

        // Người đăng
        builder.HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(x => x.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        // Bài đăng trong group
        builder.HasOne(x => x.Group)
            .WithMany(x => x.Posts)
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        // Môn thể thao
        builder.HasOne(x => x.Sport)
            .WithMany(x => x.Posts)
            .HasForeignKey(x => x.SportId)
            .OnDelete(DeleteBehavior.SetNull);

        // Feed
        builder.HasIndex(x => new
        {
            x.Status,
            x.CreatedAt
        });

        // Profile của user
        builder.HasIndex(x => new
        {
            x.AuthorId,
            x.CreatedAt
        });

        // Feed của group
        builder.HasIndex(x => new
        {
            x.GroupId,
            x.CreatedAt
        });
    }
}