using SocialSport.Api.Repositories.Implementations;
using SocialSport.Api.Repositories.Interfaces;
using SocialSport.Api.Services.Implementations;
using SocialSport.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
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
    public static IServiceCollection AddDependencies(this IServiceCollection services, IConfiguration configuration)
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
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();
        services.Configure<DataProtectionTokenProviderOptions>(options =>
        {
            options.TokenLifespan = TimeSpan.FromMinutes(30);
        });
        var jwtSettings = configuration
            .GetSection(JwtSettings.SectionName)
            .Get<JwtSettings>()
            ?? throw new InvalidOperationException("JWT configuration was not found.");

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
        services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IFollowRepository, FollowRepository>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IUserBlockRepository, UserBlockRepository>();
        services.AddScoped<IPostRepository, PostRepository>();
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<ICommentRepository, CommentRepository>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<ISavedPostRepository, SavedPostRepository>();
        services.AddScoped<IGroupRepository, GroupRepository>();
        services.AddScoped<IGroupService, GroupService>();
        services.AddScoped<IGroupMemberRepository, GroupMemberRepository>();
        services.AddScoped<IPostAccessService, PostAccessService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IPushNotificationSender, ExpoPushNotificationSender>();
        services.AddHttpClient("ExpoPush", client =>
        {
            client.BaseAddress = new Uri("https://exp.host/");
            client.Timeout = TimeSpan.FromSeconds(10);
        });
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IExploreService, ExploreService>();
        services.AddScoped<ICopyrightService, CopyrightService>();
        var copyrightEnvironment = LocalEnvironmentFile.Load();
        services
            .AddOptions<CopyrightScanningSettings>()
            .Bind(configuration.GetSection(CopyrightScanningSettings.SectionName))
            .PostConfigure(settings =>
            {
                ApplyCopyrightEnvironment(settings, copyrightEnvironment);
            });
        services.AddScoped<IExternalCopyrightScanService, ExternalCopyrightScanService>();
        services.AddHttpClient("AcrCloud", (provider, client) =>
        {
            var settings = provider
                .GetRequiredService<Microsoft.Extensions.Options.IOptions<CopyrightScanningSettings>>()
                .Value
                .AcrCloud;
            if (!string.IsNullOrWhiteSpace(settings.Host))
            {
                client.BaseAddress = new Uri($"https://{settings.Host.TrimEnd('/')}/");
            }

            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddHttpClient("GoogleVision", (provider, client) =>
        {
            var settings = provider
                .GetRequiredService<Microsoft.Extensions.Options.IOptions<CopyrightScanningSettings>>()
                .Value
                .GoogleVision;
            if (!string.IsNullOrWhiteSpace(settings.Endpoint))
            {
                client.BaseAddress = new Uri(settings.Endpoint);
            }

            client.Timeout = TimeSpan.FromSeconds(30);
        });
        services.AddScoped<IMediaUrlService, MediaUrlService>();
        var dataProtection = services
            .AddDataProtection()
            .SetApplicationName("SocialSport.Api");
        var keyRingPath = configuration["DataProtection:KeyRingPath"];

        if (!string.IsNullOrWhiteSpace(keyRingPath))
        {
            Directory.CreateDirectory(keyRingPath);
            dataProtection.PersistKeysToFileSystem(new DirectoryInfo(keyRingPath));
        }

        services.AddScoped<ISportRepository, SportRepository>();
        services.AddScoped<ISportService, SportService>();
        services.AddExceptionHandler<GlobalExceptionHandler>();
        var allowedOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>()
            ?? [];
        services.AddCors(options => options.AddPolicy("AppClients", policy =>
        {
            if (allowedOrigins.Length > 0)
            {
                policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
            }
        }));
        services.AddAuthorization();
        return services;
    }

    private static void ApplyCopyrightEnvironment(
        CopyrightScanningSettings settings,
        IReadOnlyDictionary<string, string> environment)
    {
        settings.AcrCloud.Enabled = ReadBoolean(
            environment,
            "COPYRIGHT_ACR_CLOUD_ENABLED",
            settings.AcrCloud.Enabled);
        settings.AcrCloud.Host = environment.Get(
            "COPYRIGHT_ACR_CLOUD_HOST")
            ?? settings.AcrCloud.Host;
        settings.AcrCloud.AccessKey = environment.Get(
            "COPYRIGHT_ACR_CLOUD_ACCESS_KEY")
            ?? settings.AcrCloud.AccessKey;
        settings.AcrCloud.AccessSecret = environment.Get(
            "COPYRIGHT_ACR_CLOUD_ACCESS_SECRET")
            ?? settings.AcrCloud.AccessSecret;

        settings.GoogleVision.Enabled = ReadBoolean(
            environment,
            "COPYRIGHT_GOOGLE_VISION_ENABLED",
            settings.GoogleVision.Enabled);
        settings.GoogleVision.ApiKey = environment.Get(
            "COPYRIGHT_GOOGLE_VISION_API_KEY")
            ?? settings.GoogleVision.ApiKey;
    }

    private static bool ReadBoolean(
        IReadOnlyDictionary<string, string> environment,
        string key,
        bool fallback)
    {
        return bool.TryParse(environment.Get(key), out var value)
            ? value
            : fallback;
    }
}
