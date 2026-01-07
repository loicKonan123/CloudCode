using CloudCode.Domain.Exceptions;
using System.Net;
using System.Text.Json;

namespace CloudCode.Middleware;

/// <summary>
/// Middleware de gestion globale des exceptions.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "An unhandled exception occurred: {Message}", exception.Message);

        context.Response.ContentType = "application/json";

        var response = exception switch
        {
            NotFoundException notFound => new ErrorResponse
            {
                StatusCode = (int)HttpStatusCode.NotFound,
                Code = notFound.Code,
                Message = notFound.Message
            },
            UnauthorizedException unauthorized => new ErrorResponse
            {
                StatusCode = (int)HttpStatusCode.Forbidden,
                Code = unauthorized.Code,
                Message = unauthorized.Message
            },
            ValidationException validation => new ErrorResponse
            {
                StatusCode = (int)HttpStatusCode.BadRequest,
                Code = validation.Code,
                Message = validation.Message,
                Errors = validation.Errors
            },
            ConflictException conflict => new ErrorResponse
            {
                StatusCode = (int)HttpStatusCode.Conflict,
                Code = conflict.Code,
                Message = conflict.Message
            },
            DomainException domain => new ErrorResponse
            {
                StatusCode = (int)HttpStatusCode.BadRequest,
                Code = domain.Code,
                Message = domain.Message
            },
            UnauthorizedAccessException => new ErrorResponse
            {
                StatusCode = (int)HttpStatusCode.Unauthorized,
                Code = "UNAUTHORIZED",
                Message = "Authentication required"
            },
            _ => new ErrorResponse
            {
                StatusCode = (int)HttpStatusCode.InternalServerError,
                Code = "INTERNAL_ERROR",
                Message = _env.IsDevelopment() ? exception.Message : "An internal error occurred"
            }
        };

        context.Response.StatusCode = response.StatusCode;

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);

        await context.Response.WriteAsync(json);
    }
}

public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public IDictionary<string, string[]>? Errors { get; set; }
}

/// <summary>
/// Extension pour ajouter le middleware facilement.
/// </summary>
public static class ExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ExceptionMiddleware>();
    }
}
