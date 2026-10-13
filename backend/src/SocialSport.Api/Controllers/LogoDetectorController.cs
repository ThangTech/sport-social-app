using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialSport.Api.Models.Enums;
using SocialSport.Api.Services.Implementations;

namespace SocialSport.Api.Controllers;

[ApiController]
[Authorize(Roles = "ADMIN")]
[Route("api/v1/logo-detector")]
public class LogoDetectorController(LocalLogoDetector detector) : ControllerBase
{
    [HttpPost("analyze-logo")]
    [RequestSizeLimit(21 * 1024 * 1024)]
    public async Task<IActionResult> AnalyzeLogo(IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length == 0 || file.Length > 20 * 1024 * 1024)
        {
            return BadRequest(new { detail = "Ảnh phải có dung lượng từ 1 byte đến 20MB." });
        }

        var validated = await MediaFileValidator.ValidateAsync(file);
        if (validated.MediaType != MediaType.Image)
        {
            return BadRequest(new { detail = "Chỉ hỗ trợ ảnh. Video được xem thủ công." });
        }

        var temporaryPath = Path.GetTempFileName();
        try
        {
            await using (var stream = System.IO.File.Create(temporaryPath))
            {
                await file.CopyToAsync(stream, cancellationToken);
            }

            var result = await detector.AnalyzeAsync(temporaryPath, true, cancellationToken);
            return Ok(result);
        }
        finally
        {
            System.IO.File.Delete(temporaryPath);
        }
    }
}
