namespace SocialSport.Api.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendAsync(string to, string subject, string html);
    }
}
