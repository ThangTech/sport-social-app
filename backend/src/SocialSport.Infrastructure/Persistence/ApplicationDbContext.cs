using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SocialSport.Domain.Entities;
using SocialSport.Infrastructure.Identity;

namespace SocialSport.Infrastructure.Persistence;

public class ApplicationDbContext
    : IdentityDbContext<
        ApplicationUser,
        IdentityRole<Guid>,
        Guid>
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Sport> Sports => Set<Sport>();

    public DbSet<Group> Groups => Set<Group>();

    public DbSet<GroupMember> GroupMembers =>
        Set<GroupMember>();

    public DbSet<Post> Posts => Set<Post>();

    public DbSet<PostMedia> PostMedia =>
        Set<PostMedia>();

    public DbSet<Comment> Comments =>
        Set<Comment>();

    public DbSet<PostReaction> PostReactions =>
        Set<PostReaction>();

    public DbSet<SavedPost> SavedPosts =>
        Set<SavedPost>();

    public DbSet<Follow> Follows =>
        Set<Follow>();

    public DbSet<UserBlock> UserBlocks =>
        Set<UserBlock>();

    public DbSet<Report> Reports =>
        Set<Report>();

    public DbSet<Notification> Notifications =>
        Set<Notification>();

    public DbSet<DeviceToken> DeviceTokens =>
        Set<DeviceToken>();

    public DbSet<RefreshToken> RefreshTokens =>
        Set<RefreshToken>();

    protected override void OnModelCreating(
        ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(
            typeof(ApplicationDbContext).Assembly
        );
    }
}