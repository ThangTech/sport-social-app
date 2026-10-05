using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace SocialSport.Api.Middleware;

public class GlobalExceptionHandler
    : IExceptionHandler
{
    private readonly ILogger<GlobalExceptionHandler> _logger;

    public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
    {
        _logger = logger;
    }

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var statusCode =
            exception switch
            {
                KeyNotFoundException => StatusCodes.Status404NotFound,
                UnauthorizedAccessException =>
                    StatusCodes.Status403Forbidden,

                InvalidOperationException =>
                    StatusCodes.Status400BadRequest,

                _ =>
                    StatusCodes.Status500InternalServerError
            };

        if (statusCode >= 500)
            _logger.LogError(exception, "Unhandled request error. TraceId: {TraceId}", httpContext.TraceIdentifier);
        else
            _logger.LogWarning("Request failed with {StatusCode}. TraceId: {TraceId}; Error: {ErrorType}", statusCode, httpContext.TraceIdentifier, exception.GetType().Name);

        var problemDetails =
            new ProblemDetails
            {
                Status = statusCode,

                Title =
                    statusCode switch
                    {
                        400 => "Bad Request",
                        401 => "Unauthorized",
                        403 => "Forbidden",
                        404 => "Not Found",
                        _ => "Internal Server Error"
                    },

                Detail =
                    statusCode == 500
                        ? "Đã xảy ra lỗi trong hệ thống."
                        : exception.Message,
                Extensions = { ["traceId"] = httpContext.TraceIdentifier }
            };

        httpContext.Response.StatusCode =
            statusCode;

        await httpContext.Response
            .WriteAsJsonAsync(
                problemDetails,
                cancellationToken);

        return true;
    }
}
