namespace SocialSport.Api.DTOs.Sport
{
    public class SportDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? IconUrl { get; set; }
    }
}
