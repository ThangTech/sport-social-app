using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SocialSport.Api.Data;
using SocialSport.Api.Identity;
using SocialSport.Api.Services.Implementations;

var apiRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "../../../../../src/SocialSport.Api"));
var testDatabase = $"SocialSportSmoke_{Guid.NewGuid():N}";
var uploads = Path.Combine(Path.GetTempPath(), testDatabase);
Directory.CreateDirectory(uploads);
Environment.SetEnvironmentVariable(
    "ConnectionStrings__DefaultConnection",
    $"Server=DESKTOP-PKQJ4NC;Database={testDatabase};Trusted_Connection=True;TrustServerCertificate=True");
Environment.SetEnvironmentVariable(
    "Jwt__Key",
    "SmokeTestsOnly-0123456789-abcdefghijklmnopqrstuvwxyz-0123456789");
await using var factory = new WebApplicationFactory<ApplicationDbContext>().WithWebHostBuilder(builder =>
{
    builder.UseContentRoot(apiRoot);
    builder.UseWebRoot(uploads);
    builder.UseEnvironment("Development");
    builder.ConfigureLogging(logging => logging.ClearProviders());
});
using var client = factory.CreateClient();
using var scope = factory.Services.CreateScope();
if (args.Contains("--logos-only") || args.Contains("--logo-samples"))
{
    var logoAssertions = 0;
    try
    {
        var samplesArgument = Array.IndexOf(args, "--logo-samples");
        if (samplesArgument >= 0)
        {
            var sampleDirectory = Path.GetFullPath(args[samplesArgument + 1]);
            var detector = scope.ServiceProvider.GetRequiredService<LocalLogoDetector>();
            var results = new Dictionary<string, LogoAnalysis>();
            foreach (var imagePath in Directory.GetFiles(sampleDirectory, "*.jpg"))
            {
                results[Path.GetFileName(imagePath)] = await detector.AnalyzeAsync(imagePath, true);
            }
            var resultJson = JsonSerializer.Serialize(results, new JsonSerializerOptions
            {
                WriteIndented = true
            });
            await File.WriteAllTextAsync(Path.Combine(sampleDirectory, "dotnet-results.json"), resultJson);
            Console.WriteLine(resultJson);
        }
        await LogoChecks.RunAsync(
            scope.ServiceProvider.GetRequiredService<LocalLogoDetector>(),
            scope.ServiceProvider.GetRequiredService<IConfiguration>(),
            scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>(),
            uploads,
            (condition, message) =>
            {
                if (!condition)
                {
                    throw new Exception(message);
                }
                logoAssertions++;
                Console.WriteLine($"PASS: {message}");
            });
        Console.WriteLine($"PASS: {logoAssertions} logo assertions (no database used).");
    }
    finally
    {
        Directory.Delete(uploads, true);
    }
    return;
}
var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
if (db.Database.GetDbConnection().Database != testDatabase)
{
    throw new InvalidOperationException("Refusing to run against a database not created by this test.");
}
var assertions = 0;
var adminToken = "";

try
{
    await db.Database.MigrateAsync();
    Check(await db.Sports.CountAsync() > 0, "Migrations seed sports");
    var author = await Register("author");
    var viewer = await Register("viewer");
    var admin = await Register("admin");
    var manager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
    var adminUser = await manager.FindByIdAsync(admin.Id);
    await manager.AddToRoleAsync(adminUser!, "ADMIN");
    var login = await Json(HttpMethod.Post, "/auth/login", null, new { email = "admin@example.test", password = "SmokeTest123!" });
    adminToken = login.GetProperty("accessToken").GetString()!;
    await Expect(HttpMethod.Post, "/logo-detector/analyze-logo", null, null, HttpStatusCode.Unauthorized);
    await Expect(HttpMethod.Post, "/logo-detector/analyze-logo", author.Token, null, HttpStatusCode.Forbidden);
    await CheckLogoEndpoint(adminToken);

    using (var preflight = new HttpRequestMessage(HttpMethod.Options, "/api/v1/posts"))
    {
        preflight.Headers.Add("Origin", "http://192.168.77.42:8081");
        preflight.Headers.Add("Access-Control-Request-Method", "POST");
        preflight.Headers.Add("Access-Control-Request-Headers", "authorization,content-type");
        using var response = await client.SendAsync(preflight);
        Check(response.Headers.GetValues("Access-Control-Allow-Origin").Single() == "*", "CORS accepts changed LAN origin");
    }
    await Expect(HttpMethod.Get, "/admin/posts", author.Token, null, HttpStatusCode.Forbidden);
    await Expect(HttpMethod.Post, "/posts", author.Token, new { content = "ĐỒ NGU", visibility = 1 }, HttpStatusCode.BadRequest);
    await Expect(HttpMethod.Post, "/posts", author.Token, new { content = "đồ\u200b ngu", visibility = 1 }, HttpStatusCode.BadRequest);

    var ids = new List<string>();
    for (var visibility = 1; visibility <= 3; visibility++)
    {
        var post = await Json(HttpMethod.Post, "/posts", author.Token, new { content = $"Luyện tập thể thao mỗi ngày {visibility}", visibility });
        var id = post.GetProperty("id").GetString()!;
        ids.Add(id);
        await Expect(HttpMethod.Get, $"/posts/{id}", viewer.Token, null, HttpStatusCode.NotFound);
    }
    var feed = await Json(HttpMethod.Get, "/feed", viewer.Token);
    Check(feed.GetProperty("items").GetArrayLength() == 0, "Pending posts never appear on feed");
    var queue = await Json(HttpMethod.Get, "/admin/posts?pendingOnly=true", adminToken);
    Check(queue.GetProperty("total").GetInt32() == 3, "All three audiences require system approval");
    var ownReviews = await Json(HttpMethod.Get, "/posts/reviews/mine", author.Token);
    var otherReviews = await Json(HttpMethod.Get, "/posts/reviews/mine", viewer.Token);
    Check(ownReviews.GetArrayLength() == 3, "Author can track pending posts");
    Check(otherReviews.GetArrayLength() == 0, "Review status list cannot expose another author's private posts");
    foreach (var id in ids)
    {
        await Approve(id);
    }
    await Expect(HttpMethod.Get, $"/posts/{ids[0]}", viewer.Token, null, HttpStatusCode.OK);
    await Expect(HttpMethod.Get, $"/posts/{ids[1]}", viewer.Token, null, HttpStatusCode.Forbidden);
    await Expect(HttpMethod.Get, $"/posts/{ids[2]}", viewer.Token, null, HttpStatusCode.Forbidden);
    await Expect(HttpMethod.Get, $"/posts/{ids[2]}", author.Token, null, HttpStatusCode.OK);

    var stale = await Json(HttpMethod.Get, $"/admin/posts/{ids[0]}/review", adminToken);
    const string rejectionReason = "Ảnh và nội dung chưa phù hợp với chủ đề thể thao.";
    await Expect(HttpMethod.Patch, $"/admin/posts/{ids[0]}/status", adminToken,
        new { status = 3, rowVersion = stale.GetProperty("rowVersion").GetString() }, HttpStatusCode.BadRequest);
    await Expect(HttpMethod.Patch, $"/admin/posts/{ids[0]}/status", adminToken,
        new { status = 3, reason = rejectionReason, rowVersion = stale.GetProperty("rowVersion").GetString() },
        HttpStatusCode.NoContent);
    var authorNotifications = await Json(HttpMethod.Get, "/notifications", author.Token);
    Check(authorNotifications.GetProperty("items").EnumerateArray().Any(item =>
        item.GetProperty("type").GetInt32() == 17 &&
        item.GetProperty("message").GetString()!.Contains(rejectionReason)),
        "Rejected author receives notification containing the exact reason");
    var viewerNotifications = await Json(HttpMethod.Get, "/notifications", viewer.Token);
    Check(!viewerNotifications.GetProperty("items").EnumerateArray().Any(item =>
        item.GetProperty("type").GetInt32() == 17), "Rejection reason is not sent to other users");
    var rejectionReviews = await Json(HttpMethod.Get, "/posts/reviews/mine", author.Token);
    Check(rejectionReviews.EnumerateArray().Any(item =>
        item.GetProperty("id").GetString() == ids[0] &&
        item.GetProperty("systemModerationReason").GetString() == rejectionReason),
        "Author review page receives the rejection reason");
    var audit = await Json(HttpMethod.Get, "/admin/audit", adminToken);
    Check(audit.GetProperty("items").EnumerateArray().Any(item =>
        item.GetProperty("action").GetString() == "post.rejected" &&
        item.GetProperty("displaySummary").GetString()!.Contains(rejectionReason)),
        "Audit exposes the decision and its reason");
    await Approve(ids[0]);
    stale = await Json(HttpMethod.Get, $"/admin/posts/{ids[0]}/review", adminToken);
    await Json(HttpMethod.Patch, $"/posts/{ids[0]}", author.Token, new { content = "Bài tập mới hôm nay", visibility = 1 });
    await Expect(HttpMethod.Get, $"/posts/{ids[0]}", viewer.Token, null, HttpStatusCode.NotFound);
    await Expect(HttpMethod.Patch, $"/admin/posts/{ids[0]}/status", adminToken,
        new { status = 1, reason = "Nội dung phù hợp quy định cộng đồng.", rowVersion = stale.GetProperty("rowVersion").GetString() }, HttpStatusCode.Conflict);
    await Approve(ids[0]);
    await Expect(HttpMethod.Post, $"/posts/{ids[0]}/comments", viewer.Token, new { content = "óc chó" }, HttpStatusCode.BadRequest);
    var comment = await Json(HttpMethod.Post, $"/posts/{ids[0]}/comments", viewer.Token, new { content = "Chúc bạn luyện tập tốt" });
    await Expect(HttpMethod.Patch, $"/comments/{comment.GetProperty("id").GetString()}", viewer.Token, new { content = "đồ ngu" }, HttpStatusCode.BadRequest);

    var draft = await Json(HttpMethod.Post, "/posts", author.Token, new { content = "Hình ảnh buổi tập", visibility = 1, hasMedia = true });
    var draftId = draft.GetProperty("id").GetString()!;
    var draftReview = await Json(HttpMethod.Get, $"/admin/posts/{draftId}/review", adminToken);
    await Expect(HttpMethod.Patch, $"/admin/posts/{draftId}/status", adminToken,
        new { status = 1, reason = "Nội dung phù hợp quy định cộng đồng.", rowVersion = draftReview.GetProperty("rowVersion").GetString() }, HttpStatusCode.BadRequest);
    await Upload(draftId, author.Token);
    var publication = await Json(HttpMethod.Post, $"/posts/{draftId}/finalize", author.Token);
    Check(!publication.GetProperty("isPublished").GetBoolean(), "Finalize does not bypass review");
    Check(publication.GetProperty("isPendingSystemReview").GetBoolean(), "Finalize reports system review");
    var mediaReview = await Json(HttpMethod.Get, $"/admin/posts/{draftId}/review", adminToken);
    var media = mediaReview.GetProperty("media")[0];
    using (var analysis = JsonDocument.Parse(media.GetProperty("logoAnalysisJson").GetString()!))
    {
        Check(analysis.RootElement.GetProperty("status").GetString() == "analyzed", "Uploaded image is analyzed by the real model");
        Check(analysis.RootElement.GetProperty("data").EnumerateArray().Any(
            item => item.GetProperty("label").GetString() == "Nike"), "System admin receives Nike detection on uploaded photo");
    }
    await Expect(HttpMethod.Get, media.GetProperty("url").GetString()!, adminToken, null, HttpStatusCode.OK);
    await Expect(HttpMethod.Get, media.GetProperty("url").GetString()!, viewer.Token, null, HttpStatusCode.Forbidden);
    await Approve(draftId);
    await Upload(draftId, author.Token);
    await Expect(HttpMethod.Get, $"/posts/{draftId}", viewer.Token, null, HttpStatusCode.NotFound);

    var group = await Json(HttpMethod.Post, "/groups", author.Token, new { name = "Câu lạc bộ chạy bộ", privacy = 1 });
    var groupId = group.GetProperty("id").GetString()!;
    await Json(HttpMethod.Post, $"/groups/{groupId}/join", viewer.Token);
    await Expect(HttpMethod.Post, $"/groups/{groupId}/posts", viewer.Token, new { content = "đồ ngu" }, HttpStatusCode.BadRequest);
    var groupPost = await Json(HttpMethod.Post, $"/groups/{groupId}/posts", viewer.Token, new { content = "Cùng tập luyện hôm nay" });
    var groupPostId = groupPost.GetProperty("id").GetString()!;
    await Upload(groupPostId, viewer.Token);
    var groupQueue = await Json(HttpMethod.Get, $"/groups/{groupId}/post-review-queue", author.Token);
    using (var groupAnalysis = JsonDocument.Parse(
        groupQueue[0].GetProperty("media")[0].GetProperty("logoAnalysisJson").GetString()!))
    {
        Check(groupAnalysis.RootElement.GetProperty("status").GetString() == "analyzed",
            "Group reviewer receives real model analysis");
        Check(groupAnalysis.RootElement.GetProperty("data").EnumerateArray().Any(
            item => item.GetProperty("label").GetString() == "Nike"),
            "Group reviewer receives Nike bounding box");
    }
    await Expect(HttpMethod.Post, $"/groups/{groupId}/post-review-queue/{groupPostId}/approve", author.Token, null, HttpStatusCode.NoContent);
    await Expect(HttpMethod.Get, $"/posts/{groupPostId}", viewer.Token, null, HttpStatusCode.OK);

    float[] values = [320, 321, 320, 321, 160, 160, 80, 80, .9f, .8f];
    var detections = LocalLogoDetector.Decode(values, 2, ["Logo"], 1280, 720, .5f, 0, 140);
    Check(detections.Count == 1, "YOLO NMS removes duplicate boxes");
    Check(detections[0].Bbox.SequenceEqual(new float[] { 480, 280, 800, 440 }), "YOLO maps boxes to original image");
    var detector = scope.ServiceProvider.GetRequiredService<LocalLogoDetector>();
    await LogoChecks.RunAsync(
        detector,
        scope.ServiceProvider.GetRequiredService<IConfiguration>(),
        scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>(),
        uploads,
        Check);
    Console.WriteLine($"PASS: {assertions} assertions.");
}
finally
{
    await db.Database.EnsureDeletedAsync();
    // This unique directory belongs only to this test run.
    Directory.Delete(uploads, true);
}

void Check(bool condition, string message)
{
    if (!condition) throw new Exception(message);
    assertions++;
    Console.WriteLine($"PASS: {message}");
}

async Task<(string Id, string Token)> Register(string name)
{
    var user = await Json(HttpMethod.Post, "/auth/register", null, new
    {
        userName = name,
        displayName = name,
        email = $"{name}@example.test",
        password = "SmokeTest123!"
    });
    return (user.GetProperty("user").GetProperty("id").GetString()!, user.GetProperty("accessToken").GetString()!);
}

async Task<HttpResponseMessage> Send(HttpMethod method, string path, string? token, object? body = null)
{
    using var request = new HttpRequestMessage(method, "/api/v1" + path);
    if (token != null) request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    if (body != null) request.Content = JsonContent.Create(body);
    return await client.SendAsync(request);
}

async Task<JsonElement> Json(HttpMethod method, string path, string? token, object? body = null)
{
    using var response = await Send(method, path, token, body);
    var text = await response.Content.ReadAsStringAsync();
    if (!response.IsSuccessStatusCode) throw new Exception($"{method} {path}: {response.StatusCode} {text}");
    using var document = JsonDocument.Parse(text);
    return document.RootElement.Clone();
}

async Task Expect(HttpMethod method, string path, string? token, object? body, HttpStatusCode status)
{
    using var response = await Send(method, path, token, body);
    if (response.StatusCode != status)
    {
        Console.WriteLine(await response.Content.ReadAsStringAsync());
    }
    Check(response.StatusCode == status, $"{method} {path}: expected {status}, got {response.StatusCode}");
}

async Task Approve(string id)
{
    var review = await Json(HttpMethod.Get, $"/admin/posts/{id}/review", adminToken);
    await Expect(HttpMethod.Patch, $"/admin/posts/{id}/status", adminToken,
        new { status = 1, reason = "Nội dung phù hợp quy định cộng đồng.", rowVersion = review.GetProperty("rowVersion").GetString() }, HttpStatusCode.NoContent);
}

async Task Upload(string id, string token)
{
    var fixturePath = Path.Combine(AppContext.BaseDirectory, "Fixtures", "nike.jpg");
    var bytes = await File.ReadAllBytesAsync(fixturePath);
    using var form = new MultipartFormDataContent();
    var content = new ByteArrayContent(bytes);
    content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
    form.Add(content, "file", "nike.jpg");
    using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/v1/posts/{id}/media");
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    request.Content = form;
    using var response = await client.SendAsync(request);
    if (!response.IsSuccessStatusCode) throw new Exception(await response.Content.ReadAsStringAsync());
    Check(true, "Media uploaded");
}

async Task CheckLogoEndpoint(string token)
{
    var path = Path.Combine(AppContext.BaseDirectory, "Fixtures", "nike.jpg");
    var bytes = await File.ReadAllBytesAsync(path);
    using var form = new MultipartFormDataContent();
    var content = new ByteArrayContent(bytes);
    content.Headers.ContentType = new MediaTypeHeaderValue("image/jpeg");
    form.Add(content, "file", "nike.jpg");
    using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/logo-detector/analyze-logo");
    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
    request.Content = form;
    using var response = await client.SendAsync(request);
    Check(response.StatusCode == HttpStatusCode.OK, "Admin logo endpoint accepts a real photo");
    using var analysis = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
    Check(analysis.RootElement.GetProperty("status").GetString() == "analyzed",
        "Admin logo endpoint runs the installed ONNX model");
    Check(analysis.RootElement.GetProperty("data").EnumerateArray().Any(
        item => item.GetProperty("label").GetString() == "Nike"),
        "Admin logo endpoint returns Nike label and bounding box");
}
