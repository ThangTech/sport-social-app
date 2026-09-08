using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.DTOs.Auth;
using SocialSport.Api.Services.Interfaces;
using System.Security.Claims;

namespace SocialSport.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>>
        Register(RegisterRequest request)
    {
        var result =
            await _authService.RegisterAsync(request);

        return Ok(result);
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>>
        Login(LoginRequest request)
    {
        var result =
            await _authService.LoginAsync(request);

        return Ok(result);
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>>
        Refresh(RefreshTokenRequest request)
    {
        var result =
            await _authService.RefreshTokenAsync(request);

        return Ok(result);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult>
        Logout(LogoutRequest request)
    {
        var userId = GetCurrentUserId();

        await _authService.LogoutAsync(
            userId,
            request);

        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthUserDto>>
        Me()
    {
        var userId = GetCurrentUserId();

        var user =
            await _authService
                .GetCurrentUserAsync(userId);

        if (user is null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    private Guid GetCurrentUserId()
    {
        var value =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(
            value,
            out var userId))
        {
            throw new UnauthorizedAccessException(
                "User id trong token không hợp lệ.");
        }
        return userId;
    }
}