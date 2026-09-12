using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.DTOs.Post
{
    public class ReactionResponse
    {
        public int ReactionCount { get; set; }
        public ReactionType? CurrentReaction { get; set; }
    }
}
