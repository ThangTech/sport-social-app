using SocialSport.Api.Extensions;
using Microsoft.Extensions.FileProviders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddOpenApi();

builder.Services.AddProblemDetails();

builder.Services.AddDependencies(
    builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler();
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
//app.UseHttpsRedirection();
var publicUploadRoot = Path.Combine(app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot"), "uploads");
foreach (var publicFolder in new[] { "avatars", "covers", "groups" })
{
    var physicalPath = Path.Combine(publicUploadRoot, publicFolder);
    Directory.CreateDirectory(physicalPath);
    app.UseStaticFiles(new StaticFileOptions { FileProvider = new PhysicalFileProvider(physicalPath), RequestPath = $"/uploads/{publicFolder}" });
}
app.UseCors("AppClients");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
