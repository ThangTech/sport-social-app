using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace SocialSport.Api.Middleware;

public class GlobalExceptionHandler
    : IExceptionHandler
{
    public async ValueTask<bool>
        TryHandleAsync(HttpContext httpContext,Exception exception,CancellationToken cancellationToken)
    {
        var statusCode =
            exception switch
            {
                KeyNotFoundException => StatusCodes.Status404NotFound,
                UnauthorizedAccessException =>
                    StatusCodes.Status401Unauthorized,

                InvalidOperationException =>
                    StatusCodes.Status400BadRequest,

                _ =>
                    StatusCodes.Status500InternalServerError
            };

        var problemDetails =
            new ProblemDetails
            {
                Status = statusCode,

                Title =
                    statusCode switch
                    {
                        400 => "Bad Request",
                        401 => "Unauthorized",
                        _ => "Internal Server Error"
                    },

                Detail =
                    statusCode == 500
                        ? "Đã xảy ra lỗi trong hệ thống."
                        : exception.Message
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