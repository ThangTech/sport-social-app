namespace SocialSport.Api.DTOs.Post
{
    public class PostMediaUploadResponse
    {
        public Guid Id { get; set; }
        public string Url { get; set; } = string.Empty;
        public int MediaType { get; set; }
        public int SortOrder { get; set; }
    }
}
