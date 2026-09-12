namespace SocialSport.Api.DTOs.Post
{
    public class PostMediaDto
    {
        public Guid Id { get; set; }
        public string Url { get; set; } = string.Empty;
        public int MediaType { get; set; }
        public int SortOrder { get; set; }
    }
}
