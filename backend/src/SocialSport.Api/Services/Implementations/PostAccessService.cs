using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;

namespace SocialSport.Api.Services.Implementations
{
    public class PostAccessService : IPostAccessService
    {
        private readonly IFollowRepository _followRepository;
        private readonly IUserBlockRepository _userBlockRepository;
        private readonly IGroupRepository _groupRepository;
        private readonly IGroupMemberRepository _groupMemberRepository;

        public PostAccessService(IFollowRepository followRepository, IUserBlockRepository userBlockRepository, IGroupRepository groupRepository, IGroupMemberRepository groupMemberRepository)
        {
            _followRepository = followRepository;
            _userBlockRepository = userBlockRepository;
            _groupRepository = groupRepository;
            _groupMemberRepository = groupMemberRepository;
        }

        public async Task<bool> CanViewAsync(Guid? userId, Post post)
        {
            if (post.Status != PostStatus.Published)
                return false;

            if (userId.HasValue && userId.Value != post.AuthorId)
            {
                var blockedByMe = await _userBlockRepository.IsBlockedAsync(userId.Value, post.AuthorId);
                var blockedMe = await _userBlockRepository.IsBlockedAsync(post.AuthorId, userId.Value);

                if (blockedByMe || blockedMe)
                    return false;
            }

            if (post.GroupId.HasValue)
            {
                var group = await _groupRepository.GetByIdAsync(post.GroupId.Value);

                if (group is null || group.Status != GroupStatus.Active)
                    return false;

                GroupMember? member = null;

                if (userId.HasValue)
                    member = await _groupMemberRepository.GetAsync(group.Id, userId.Value);

                if (member?.Status == GroupMemberStatus.Banned)
                    return false;

                if (group.Privacy == GroupPrivacy.Public)
                    return true;

                return member is not null && member.Status == GroupMemberStatus.Active;
            }

            if (userId.HasValue && userId.Value == post.AuthorId)
                return true;

            if (post.Visibility == PostVisibility.Public)
                return true;

            if (post.Visibility == PostVisibility.Followers && userId.HasValue)
                return await _followRepository.IsFollowingAsync(userId.Value, post.AuthorId);

            return false;
        }

        public async Task EnsureCanViewAsync(Guid? userId, Post post)
        {
            if (!await CanViewAsync(userId, post))
                throw new UnauthorizedAccessException("Bạn không có quyền xem bài viết này.");
        }

        public async Task EnsureCanInteractAsync(Guid userId, Post post)
        {
            if (!await CanViewAsync(userId, post))
                throw new UnauthorizedAccessException("Bạn không có quyền tương tác với bài viết này.");

            if (!post.GroupId.HasValue)
                return;

            var member = await _groupMemberRepository.GetAsync(post.GroupId.Value, userId);

            if (member is null || member.Status != GroupMemberStatus.Active)
                throw new UnauthorizedAccessException("Bạn phải là thành viên của nhóm để tương tác.");
        }
    }
}
