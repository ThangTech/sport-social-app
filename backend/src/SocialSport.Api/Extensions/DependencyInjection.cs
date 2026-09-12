using SocialSport.Api.Repositories.Implementations;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Implementations;
using SocialSport.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using SocialSport.Api.Middleware;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SocialSport.Api.Data;
using SocialSport.Api.Identity;
using SocialSport.Api.Settings;
using System.Text;

namespace SocialSport.Api.Extensions;

public static class DependencyInjection
{
    public static IServiceCollection AddDependencies(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "Connection string 'DefaultConnection' was not found.");

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.User.RequireUniqueEmail = true;

                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<ApplicationDbContext>();
        var jwtSettings = configuration
    .GetSection(JwtSettings.SectionName)
    .Get<JwtSettings>()
    ?? throw new InvalidOperationException(
        "JWT configuration was not found.");

        if (string.IsNullOrWhiteSpace(jwtSettings.Key))
        {
            throw new InvalidOperationException(
                "JWT key was not configured.");
        }

        services.Configure<JwtSettings>(
            configuration.GetSection(JwtSettings.SectionName));

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme =
                    JwtBearerDefaults.AuthenticationScheme;

                options.DefaultChallengeScheme =
                    JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters =
                    new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,

                        ValidIssuer = jwtSettings.Issuer,
                        ValidAudience = jwtSettings.Audience,

                        IssuerSigningKey =
                            new SymmetricSecurityKey(
                                Encoding.UTF8.GetBytes(
                                    jwtSettings.Key)),

                        ClockSkew = TimeSpan.Zero
                    };
            });
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>(); 
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IFollowRepository, FollowRepository>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUserBlockRepository, UserBlockRepository>();
        services.AddScoped<IPostRepository, PostRepository>();
        services.AddScoped<IPostService, PostService>();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        services.AddAuthorization();
        return services;
    }
}