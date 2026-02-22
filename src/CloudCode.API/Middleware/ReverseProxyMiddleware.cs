using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.RegularExpressions;
using CloudCode.Application.Interfaces;

namespace CloudCode.Middleware;

/// <summary>
/// Middleware de reverse proxy pour accéder aux applications utilisateur.
/// Route: /app/{projectId}/* -> localhost:{port}/*
/// </summary>
public class ReverseProxyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ReverseProxyMiddleware> _logger;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;

    // Pattern pour matcher /app/{guid}/...
    private static readonly Regex AppPathPattern = new(
        @"^/app/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(/.*)?$",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public ReverseProxyMiddleware(
        RequestDelegate next,
        ILogger<ReverseProxyMiddleware> logger,
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context, IPortDetectionService portDetectionService, IProjectService projectService)
    {
        var path = context.Request.Path.Value;

        // Vérifier si c'est une route /app/{projectId}
        if (path != null && path.StartsWith("/app/", StringComparison.OrdinalIgnoreCase))
        {
            var match = AppPathPattern.Match(path);
            if (match.Success)
            {
                await HandleAppProxy(context, match, portDetectionService, projectService);
                return;
            }
        }

        await _next(context);
    }

    private async Task HandleAppProxy(
        HttpContext context,
        Match match,
        IPortDetectionService portDetectionService,
        IProjectService projectService)
    {
        var projectIdStr = match.Groups[1].Value;
        var appPath = match.Groups[2].Success ? match.Groups[2].Value : "/";

        if (!Guid.TryParse(projectIdStr, out var projectId))
        {
            context.Response.StatusCode = 400;
            await context.Response.WriteAsync("Invalid project ID");
            return;
        }

        // Récupérer l'utilisateur authentifié
        var userIdClaim = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsync("Authentication required");
            return;
        }

        // Vérifier l'accès au projet
        try
        {
            var hasAccess = await projectService.UserHasAccessAsync(projectId, userId, context.RequestAborted);
            if (!hasAccess)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsync("Access denied to this project");
                return;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking project access");
            context.Response.StatusCode = 404;
            await context.Response.WriteAsync("Project not found");
            return;
        }

        // Détecter le port de l'application
        var port = portDetectionService.DetectAppPort(projectId, userId);
        if (port == null)
        {
            context.Response.StatusCode = 503;
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.WriteAsync(GetNoAppRunningHtml());
            return;
        }

        // Construire l'URL cible
        var targetUrl = $"http://127.0.0.1:{port}{appPath}";
        if (!string.IsNullOrEmpty(context.Request.QueryString.Value))
        {
            targetUrl += context.Request.QueryString.Value;
        }

        _logger.LogDebug("Proxying request to {TargetUrl}", targetUrl);

        // Forward la requête
        await ForwardRequest(context, targetUrl);
    }

    private async Task ForwardRequest(HttpContext context, string targetUrl)
    {
        var timeout = _configuration.GetValue<int>("AppProxy:Timeout", 30000);

        using var httpClient = _httpClientFactory.CreateClient();
        httpClient.Timeout = TimeSpan.FromMilliseconds(timeout);

        try
        {
            // Créer la requête
            using var requestMessage = new HttpRequestMessage(
                new HttpMethod(context.Request.Method),
                targetUrl);

            // Copier les headers (sauf Host)
            foreach (var header in context.Request.Headers)
            {
                if (header.Key.Equals("Host", StringComparison.OrdinalIgnoreCase))
                    continue;
                if (header.Key.Equals("Content-Length", StringComparison.OrdinalIgnoreCase))
                    continue;
                if (header.Key.Equals("Content-Type", StringComparison.OrdinalIgnoreCase))
                    continue;

                requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
            }

            // Copier le body si présent
            if (context.Request.ContentLength > 0 || context.Request.ContentType != null)
            {
                requestMessage.Content = new StreamContent(context.Request.Body);
                if (!string.IsNullOrEmpty(context.Request.ContentType))
                {
                    requestMessage.Content.Headers.ContentType =
                        MediaTypeHeaderValue.Parse(context.Request.ContentType);
                }
            }

            // Envoyer la requête
            using var response = await httpClient.SendAsync(
                requestMessage,
                HttpCompletionOption.ResponseHeadersRead,
                context.RequestAborted);

            // Copier le status code
            context.Response.StatusCode = (int)response.StatusCode;

            // Copier les headers de réponse
            foreach (var header in response.Headers)
            {
                if (header.Key.Equals("Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
                    continue;

                context.Response.Headers.TryAdd(header.Key, header.Value.ToArray());
            }

            foreach (var header in response.Content.Headers)
            {
                context.Response.Headers.TryAdd(header.Key, header.Value.ToArray());
            }

            // Copier le body
            await response.Content.CopyToAsync(context.Response.Body, context.RequestAborted);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Failed to proxy request to {TargetUrl}", targetUrl);
            context.Response.StatusCode = 502;
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.WriteAsync(GetGatewayErrorHtml(ex.Message));
        }
        catch (TaskCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            // Client cancelled, nothing to do
        }
        catch (TaskCanceledException)
        {
            context.Response.StatusCode = 504;
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.WriteAsync(GetTimeoutErrorHtml());
        }
    }

    private static string GetNoAppRunningHtml()
    {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Application not running</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #1a1b26;
                        color: #c0caf5;
                    }
                    .container {
                        text-align: center;
                        padding: 2rem;
                    }
                    h1 { color: #7aa2f7; margin-bottom: 1rem; }
                    p { color: #9aa5ce; margin-bottom: 0.5rem; }
                    code {
                        background: #24283b;
                        padding: 0.5rem 1rem;
                        border-radius: 4px;
                        display: inline-block;
                        margin: 1rem 0;
                    }
                    .hint { font-size: 0.9rem; color: #565f89; }
                </style>
                <script>
                    // Auto-refresh every 3 seconds
                    setTimeout(() => location.reload(), 3000);
                </script>
            </head>
            <body>
                <div class="container">
                    <h1>Application not running</h1>
                    <p>No application detected on ports 3000-3100.</p>
                    <p>Start your server in the terminal:</p>
                    <code>npm start</code>
                    <p>or</p>
                    <code>node app.js</code>
                    <p class="hint">This page will refresh automatically when an app is detected.</p>
                </div>
            </body>
            </html>
            """;
    }

    private static string GetGatewayErrorHtml(string error)
    {
        return $$"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Gateway Error</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #1a1b26;
                        color: #c0caf5;
                    }
                    .container { text-align: center; padding: 2rem; }
                    h1 { color: #f7768e; }
                    p { color: #9aa5ce; }
                    .error {
                        background: #24283b;
                        padding: 1rem;
                        border-radius: 4px;
                        font-family: monospace;
                        font-size: 0.9rem;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>502 Bad Gateway</h1>
                    <p>Failed to connect to the application.</p>
                    <div class="error">{{System.Web.HttpUtility.HtmlEncode(error)}}</div>
                </div>
            </body>
            </html>
            """;
    }

    private static string GetTimeoutErrorHtml()
    {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <title>Gateway Timeout</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #1a1b26;
                        color: #c0caf5;
                    }
                    .container { text-align: center; padding: 2rem; }
                    h1 { color: #e0af68; }
                    p { color: #9aa5ce; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>504 Gateway Timeout</h1>
                    <p>The application took too long to respond.</p>
                </div>
            </body>
            </html>
            """;
    }
}

/// <summary>
/// Extension pour ajouter le middleware facilement.
/// </summary>
public static class ReverseProxyMiddlewareExtensions
{
    public static IApplicationBuilder UseReverseProxy(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ReverseProxyMiddleware>();
    }
}
