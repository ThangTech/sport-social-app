using Microsoft.AspNetCore.Identity;
using SocialSport.Api.DTOs.Group;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;
using System.Globalization;
using System.Text;

namespace SocialSport.Api.Services.Implementations;

public class GroupService : IGroupService
{
    private readonly IGroupRepository _groupRepository;
    private readonly UserManager<ApplicationUser> _userManager;

    public GroupService(IGroupRepository groupRepository, UserManager<ApplicationUser> userManager)
    {
        _groupRepository = groupRepository;
        _userManager = userManager;
    }

    public async Task<GroupDto> CreateAsync(Guid userId, CreateGroupRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());

        if (user is null)
            throw new KeyNotFoundException("Không tìm thấy người dùng.");

        var slug = await CreateUniqueSlugAsync(request.Name);

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = slug,
            Description = request.Description?.Trim(),
            OwnerId = userId,
            Privacy = request.Privacy,
            Status = GroupStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        group.Members.Add(new GroupMember
        {
            GroupId = group.Id,
            UserId = userId,
            Role = GroupMemberRole.Admin,
            Status = GroupMemberStatus.Active,
            JoinedAt = DateTimeOffset.UtcNow
        });

        await _groupRepository.AddAsync(group);
        await _groupRepository.SaveChangesAsync();

        return new GroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Slug = group.Slug,
            Description = group.Description,
            AvatarUrl = group.AvatarUrl,
            CoverUrl = group.CoverUrl,
            OwnerId = group.OwnerId,
            OwnerName = user.DisplayName,
            Privacy = group.Privacy,
            Status = group.Status,
            MemberCount = group.Members.Count(x => x.Status == GroupMemberStatus.Active),
            IsMember = true,
            CurrentUserRole = GroupMemberRole.Admin,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task<GroupDto?> GetByIdAsync(Guid groupId, Guid? currentUserId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status == GroupStatus.Removed)
            return null;

        var owner = await _userManager.FindByIdAsync(group.OwnerId.ToString());

        GroupMember? currentMember = null;

        if (currentUserId.HasValue)
            currentMember = group.Members.FirstOrDefault(x => x.UserId == currentUserId.Value && x.Status == GroupMemberStatus.Active);

        return new GroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Slug = group.Slug,
            Description = group.Description,
            AvatarUrl = group.AvatarUrl,
            CoverUrl = group.CoverUrl,
            OwnerId = group.OwnerId,
            OwnerName = owner?.DisplayName ?? string.Empty,
            Privacy = group.Privacy,
            Status = group.Status,
            MemberCount = group.Members.Count(x => x.Status == GroupMemberStatus.Active),
            IsMember = currentMember is not null,
            CurrentUserRole = currentMember?.Role,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task<GroupDto> UpdateAsync(Guid userId, Guid groupId, UpdateGroupRequest request)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status == GroupStatus.Removed)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        if (group.OwnerId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền chỉnh sửa nhóm này.");

        group.Name = request.Name.Trim();
        group.Description = request.Description?.Trim();
        group.Privacy = request.Privacy;
        group.UpdatedAt = DateTimeOffset.UtcNow;

        await _groupRepository.SaveChangesAsync();

        var owner = await _userManager.FindByIdAsync(group.OwnerId.ToString());
        var currentMember = group.Members.FirstOrDefault(x => x.UserId == userId && x.Status == GroupMemberStatus.Active);

        return new GroupDto
        {
            Id = group.Id,
            Name = group.Name,
            Slug = group.Slug,
            Description = group.Description,
            AvatarUrl = group.AvatarUrl,
            CoverUrl = group.CoverUrl,
            OwnerId = group.OwnerId,
            OwnerName = owner?.DisplayName ?? string.Empty,
            Privacy = group.Privacy,
            Status = group.Status,
            MemberCount = group.Members.Count(x => x.Status == GroupMemberStatus.Active),
            IsMember = currentMember is not null,
            CurrentUserRole = currentMember?.Role,
            CreatedAt = group.CreatedAt,
            UpdatedAt = group.UpdatedAt
        };
    }

    public async Task DeleteAsync(Guid userId, Guid groupId)
    {
        var group = await _groupRepository.GetByIdAsync(groupId);

        if (group is null || group.Status == GroupStatus.Removed)
            throw new KeyNotFoundException("Không tìm thấy nhóm.");

        if (group.OwnerId != userId)
            throw new UnauthorizedAccessException("Bạn không có quyền xóa nhóm này.");

        group.Status = GroupStatus.Removed;
        group.DeletedAt = DateTimeOffset.UtcNow;

        await _groupRepository.SaveChangesAsync();
    }

    private async Task<string> CreateUniqueSlugAsync(string name)
    {
        var slug = CreateSlug(name);
        var result = slug;

        while (await _groupRepository.SlugExistsAsync(result))
            result = $"{slug}-{Guid.NewGuid().ToString("N")[..6]}";

        return result;
    }

    private static string CreateSlug(string value)
    {
        value = value.Trim().ToLowerInvariant().Replace("đ", "d");

        var normalized = value.Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder();

        foreach (var c in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                builder.Append(c);
        }

        var slug = builder.ToString().Normalize(NormalizationForm.FormC);
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9]+", "-").Trim('-');

        return string.IsNullOrWhiteSpace(slug) ? "group" : slug;
    }
}