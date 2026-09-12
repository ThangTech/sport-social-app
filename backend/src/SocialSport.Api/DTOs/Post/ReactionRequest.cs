using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.DTOs.Post
{
    public class ReactionRequest
    {
        public ReactionType Type { get; set; } = ReactionType.Like;
    }
}
