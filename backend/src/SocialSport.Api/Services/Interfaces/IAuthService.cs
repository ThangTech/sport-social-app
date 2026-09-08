using SocialSport.Api.DTOs.Auth;

namespace SocialSport.Api.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);

    Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request);

    Task LogoutAsync(Guid userId,LogoutRequest request);

    Task<AuthUserDto?> GetCurrentUserAsync(Guid userId);
}