using SocialSport.Api.Models.Enums;

namespace SocialSport.Api.Services.Implementations;

internal static class MediaFileValidator
{
    public static async Task<ValidatedMediaFile> ValidateAsync(IFormFile file)
    {
        var declaredType = file.ContentType.Trim().ToLowerInvariant();
        var header = new byte[12];

        await using var stream = file.OpenReadStream();
        var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length));

        return declaredType switch
        {
            "image/jpeg" or "image/jpg" when IsJpeg(header, bytesRead) =>
                new ValidatedMediaFile(MediaType.Image, ".jpg", "image/jpeg"),
            "image/png" when IsPng(header, bytesRead) =>
                new ValidatedMediaFile(MediaType.Image, ".png", "image/png"),
            "image/webp" when IsWebP(header, bytesRead) =>
                new ValidatedMediaFile(MediaType.Image, ".webp", "image/webp"),
            "video/mp4" when IsIsoBaseMedia(header, bytesRead) =>
                new ValidatedMediaFile(MediaType.Video, ".mp4", "video/mp4"),
            "video/quicktime" when IsIsoBaseMedia(header, bytesRead) =>
                new ValidatedMediaFile(MediaType.Video, ".mov", "video/quicktime"),
            "video/webm" when IsWebM(header, bytesRead) =>
                new ValidatedMediaFile(MediaType.Video, ".webm", "video/webm"),
            _ => throw new InvalidOperationException(
                "Chỉ hỗ trợ JPEG, PNG, WebP, MP4, MOV hoặc WebM và nội dung file phải đúng định dạng khai báo.")
        };
    }

    private static bool IsJpeg(byte[] header, int length)
    {
        return length >= 3
            && header[0] == 0xFF
            && header[1] == 0xD8
            && header[2] == 0xFF;
    }

    private static bool IsPng(byte[] header, int length)
    {
        return length >= 8
            && header.AsSpan(0, 8).SequenceEqual(
                new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });
    }

    private static bool IsWebP(byte[] header, int length)
    {
        return length >= 12
            && header.AsSpan(0, 4).SequenceEqual("RIFF"u8)
            && header.AsSpan(8, 4).SequenceEqual("WEBP"u8);
    }

    private static bool IsIsoBaseMedia(byte[] header, int length)
    {
        return length >= 12
            && header.AsSpan(4, 4).SequenceEqual("ftyp"u8);
    }

    private static bool IsWebM(byte[] header, int length)
    {
        return length >= 4
            && header.AsSpan(0, 4).SequenceEqual(
                new byte[] { 0x1A, 0x45, 0xDF, 0xA3 });
    }
}

internal sealed record ValidatedMediaFile(
    MediaType MediaType,
    string Extension,
    string ContentType);
