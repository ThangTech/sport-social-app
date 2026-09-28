namespace SocialSport.Api.DTOs.Group
{
    public class GroupsResponse
    {
        public List<GroupDto> Items { get; set; } = [];
        public string? NextCursor { get; set; }
    }
}
