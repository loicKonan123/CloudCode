using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using CloudCode.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CloudCode.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(HttpClient httpClient, IConfiguration configuration, ILogger<EmailService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendPasswordResetAsync(string toEmail, string resetLink)
    {
        var apiKey = _configuration["Resend:ApiKey"];
        var fromEmail = _configuration["Resend:FromEmail"] ?? "onboarding@resend.dev";

        if (string.IsNullOrEmpty(apiKey))
        {
            _logger.LogWarning("Resend API key not configured. Reset link: {Link}", resetLink);
            return;
        }

        var html = $@"
<!DOCTYPE html>
<html>
<head><meta charset='utf-8'></head>
<body style='font-family:sans-serif;background:#0f172a;color:#e2e8f0;padding:40px'>
  <div style='max-width:480px;margin:0 auto;background:#1e293b;border-radius:12px;padding:40px;border:1px solid #334155'>
    <h1 style='color:#3caff6;font-size:24px;margin:0 0 8px'>CloudCode</h1>
    <p style='color:#94a3b8;font-size:14px;margin:0 0 32px'>Password Reset</p>
    <p style='font-size:15px;margin:0 0 24px'>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
    <a href='{resetLink}' style='display:inline-block;background:#3caff6;color:#0f172a;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px'>Reset my password</a>
    <p style='color:#64748b;font-size:12px;margin:32px 0 0'>If you didn't request this, you can ignore this email.</p>
  </div>
</body>
</html>";

        var payload = new
        {
            from = fromEmail,
            to = new[] { toEmail },
            subject = "Reset your CloudCode password",
            html
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            _logger.LogError("Resend error {Status}: {Body}", response.StatusCode, body);
        }

        // Log le lien en console pour debug (utile si Resend bloque l'email)
        _logger.LogInformation("=== PASSWORD RESET LINK === {Link}", resetLink);
    }
}
