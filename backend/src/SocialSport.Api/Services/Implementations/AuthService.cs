using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SocialSport.Api.DTOs.Auth;
using SocialSport.Api.Identity;
using SocialSport.Api.Models.Entities;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Interfaces;
using SocialSport.Api.Settings;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SocialSport.Api.Services.Implementations;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly JwtSettings _jwtSettings;

    public AuthService(UserManager<ApplicationUser> userManager, IRefreshTokenRepository refreshTokenRepository, IOptions<JwtSettings> jwtOptions)
    {
        _userManager = userManager;
        _refreshTokenRepository = refreshTokenRepository;
        _jwtSettings = jwtOptions.Value;
    }

    // =========================
    // REGISTER
    // =========================
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim();
        var userName = request.UserName.Trim();

        if (await _userManager.FindByEmailAsync(email) is not null)
            throw new InvalidOperationException("Email đã được sử dụng.");

        if (await _userManager.FindByNameAsync(userName) is not null)
            throw new InvalidOperationException("Tên người dùng đã được sử dụng.");

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = userName,
            Email = email,
            DisplayName = request.DisplayName.Trim(),
            Status = UserStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);

        if (!createResult.Succeeded)
            throw new InvalidOperationException(GetIdentityErrors(createResult));

        var roleResult = await _userManager.AddToRoleAsync(user, "USER");

        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            throw new InvalidOperationException(GetIdentityErrors(roleResult));
        }

        return await CreateAuthResponseAsync(user);
    }

    // =========================
    // LOGIN
    // =========================
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim();
        var user = await _userManager.FindByEmailAsync(email);

        if (user is null)
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác.");

        var passwordValid = await _userManager.CheckPasswordAsync(user, request.Password);

        if (!passwordValid)
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác.");

        if (user.Status != UserStatus.Active)
            throw new UnauthorizedAccessException("Tài khoản hiện không hoạt động.");

        return await CreateAuthResponseAsync(user);
    }

    // =========================
    // REFRESH TOKEN
    // =========================
    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var tokenHash = HashRefreshToken(request.RefreshToken);
        var storedToken = await _refreshTokenRepository.GetByHashAsync(tokenHash);

        if (storedToken is null || storedToken.IsRevoked || storedToken.IsExpired)
            throw new UnauthorizedAccessException("Refresh token không hợp lệ hoặc đã hết hạn.");

        var user = await _userManager.FindByIdAsync(storedToken.UserId.ToString());

        if (user is null || user.Status != UserStatus.Active)
            throw new UnauthorizedAccessException("Tài khoản không hợp lệ.");

        storedToken.RevokedAt = DateTimeOffset.UtcNow;

        return await CreateAuthResponseAsync(user);
    }

    // =========================
    // LOGOUT
    // =========================
    public async Task LogoutAsync(Guid userId, LogoutRequest request)
    {
        var tokenHash = HashRefreshToken(request.RefreshToken);
        var storedToken = await _refreshTokenRepository.GetByHashAsync(tokenHash);

        if (storedToken is null)
            return;

        if (storedToken.UserId != userId)
            throw new UnauthorizedAccessException("Refresh token không thuộc tài khoản hiện tại.");

        if (storedToken.IsRevoked)
            return;

        storedToken.RevokedAt = DateTimeOffset.UtcNow;

        await _refreshTokenRepository.SaveChangesAsync();
    }

    // =========================
    // CURRENT USER
    // =========================
    public async Task<AuthUserDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());

        if (user is null)
            return null;

        var roles = await _userManager.GetRolesAsync(user);

        return new AuthUserDto
        {
            Id = user.Id,
            UserName = user.UserName ?? string.Empty,
            Email = user.Email ?? string.Empty,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            Roles = roles
        };
    }

    // =========================
    // CREATE AUTH RESPONSE
    // =========================
    private async Task<AuthResponse> CreateAuthResponseAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);

        var accessTokenExpiresAt = DateTimeOffset.UtcNow.AddMinutes(_jwtSettings.AccessTokenMinutes);
        var accessToken = GenerateAccessToken(user, roles, accessTokenExpiresAt);

        var rawRefreshToken = GenerateRefreshToken();
        var refreshTokenExpiresAt = DateTimeOffset.UtcNow.AddDays(_jwtSettings.RefreshTokenDays);

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashRefreshToken(rawRefreshToken),
            ExpiresAt = refreshTokenExpiresAt,
            CreatedAt = DateTimeOffset.UtcNow
        };

        await _refreshTokenRepository.AddAsync(refreshToken);
        await _refreshTokenRepository.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            AccessTokenExpiresAt = accessTokenExpiresAt,
            RefreshToken = rawRefreshToken,
            RefreshTokenExpiresAt = refreshTokenExpiresAt,
            User = new AuthUserDto
            {
                Id = user.Id,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl,
                Roles = roles
            }
        };
    }

    // =========================
    // JWT
    // =========================
    private string GenerateAccessToken(ApplicationUser user, IList<string> roles, DateTimeOffset expiresAt)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.UserName ?? string.Empty),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in roles)
            claims.Add(new Claim(ClaimTypes.Role, role));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // =========================
    // REFRESH TOKEN HELPERS
    // =========================
    private static string GenerateRefreshToken()
    {
        var randomBytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(randomBytes);
    }

    private static string HashRefreshToken(string refreshToken)
    {
        var bytes = Encoding.UTF8.GetBytes(refreshToken);
        var hash = SHA256.HashData(bytes);

        return Convert.ToHexString(hash);
    }

    // =========================
    // MAPPING
    // =========================

    private static string GetIdentityErrors(IdentityResult result)
    {
        return string.Join("; ", result.Errors.Select(x => x.Description));
    }
}