using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using CloudCode.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service d'assistance IA utilisant OpenAI GPT.
/// </summary>
public class AIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AIService> _logger;
    private readonly string _apiKey;
    private readonly string _model;

    public AIService(HttpClient httpClient, IConfiguration configuration, ILogger<AIService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        _apiKey = configuration["OpenAI:ApiKey"] ?? "";
        _model = configuration["OpenAI:Model"] ?? "gpt-3.5-turbo";

        _httpClient.BaseAddress = new Uri("https://api.openai.com/v1/");
        if (!string.IsNullOrEmpty(_apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_apiKey}");
        }
    }

    public async Task<string> ExplainCodeAsync(string code, string language, CancellationToken cancellationToken = default)
    {
        var prompt = $"Explain the following {language} code in a clear and concise way. Include what the code does, how it works, and any important details:\n\n```{language}\n{code}\n```";
        return await SendChatCompletionAsync(prompt, cancellationToken);
    }

    public async Task<string> FixCodeAsync(string code, string error, string language, CancellationToken cancellationToken = default)
    {
        var prompt = $"Fix the following {language} code that produces this error:\n\nError: {error}\n\nCode:\n```{language}\n{code}\n```\n\nProvide the corrected code with an explanation of what was wrong.";
        return await SendChatCompletionAsync(prompt, cancellationToken);
    }

    public async Task<string> GenerateCodeAsync(string prompt, string language, CancellationToken cancellationToken = default)
    {
        var fullPrompt = $"Generate {language} code for the following request:\n\n{prompt}\n\nProvide clean, well-commented code.";
        return await SendChatCompletionAsync(fullPrompt, cancellationToken);
    }

    public async Task<IEnumerable<string>> GetCompletionsAsync(string code, int cursorPosition, string language, CancellationToken cancellationToken = default)
    {
        var contextBefore = code.Substring(0, Math.Min(cursorPosition, code.Length));
        var contextAfter = cursorPosition < code.Length ? code.Substring(cursorPosition) : "";

        var prompt = $"Given this {language} code context, suggest 3-5 possible code completions at the cursor position marked with |CURSOR|:\n\n```{language}\n{contextBefore}|CURSOR|{contextAfter}\n```\n\nReturn only the completion suggestions, one per line, without explanations.";

        var response = await SendChatCompletionAsync(prompt, cancellationToken);
        return response.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                      .Select(s => s.Trim())
                      .Where(s => !string.IsNullOrEmpty(s))
                      .Take(5);
    }

    public async Task<string> DocumentCodeAsync(string code, string language, CancellationToken cancellationToken = default)
    {
        var prompt = $"Add comprehensive documentation to the following {language} code. Include:\n- Function/class descriptions\n- Parameter documentation\n- Return value documentation\n- Usage examples if appropriate\n\n```{language}\n{code}\n```";
        return await SendChatCompletionAsync(prompt, cancellationToken);
    }

    public async Task<string> RefactorCodeAsync(string code, string instructions, string language, CancellationToken cancellationToken = default)
    {
        var prompt = $"Refactor the following {language} code according to these instructions:\n\nInstructions: {instructions}\n\nCode:\n```{language}\n{code}\n```\n\nProvide the refactored code with explanations of the changes made.";
        return await SendChatCompletionAsync(prompt, cancellationToken);
    }

    public async Task<string> OptimizeCodeAsync(string code, string language, CancellationToken cancellationToken = default)
    {
        var prompt = $"Optimize the following {language} code for better performance, readability, and best practices. Explain the optimizations made:\n\n```{language}\n{code}\n```";
        return await SendChatCompletionAsync(prompt, cancellationToken);
    }

    #region Private Methods

    private async Task<string> SendChatCompletionAsync(string prompt, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_apiKey))
        {
            _logger.LogWarning("OpenAI API key not configured. Returning mock response.");
            return GetMockResponse(prompt);
        }

        try
        {
            var request = new
            {
                model = _model,
                messages = new[]
                {
                    new { role = "system", content = "You are a helpful programming assistant. Provide clear, concise, and accurate responses." },
                    new { role = "user", content = prompt }
                },
                max_tokens = 2000,
                temperature = 0.7
            };

            var response = await _httpClient.PostAsJsonAsync("chat/completions", request, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("OpenAI API error: {Error}", error);
                throw new Exception($"OpenAI API error: {response.StatusCode}");
            }

            var result = await response.Content.ReadFromJsonAsync<OpenAIResponse>(cancellationToken);
            return result?.Choices?.FirstOrDefault()?.Message?.Content ?? "No response generated.";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling OpenAI API");
            return GetMockResponse(prompt);
        }
    }

    private string GetMockResponse(string prompt)
    {
        // Réponse simulée pour le développement sans clé API
        if (prompt.Contains("Explain"))
        {
            return "**Code Explanation (Mock)**\n\nThis is a mock response. Configure your OpenAI API key in appsettings.json to get real AI responses.\n\nTo configure:\n```json\n\"OpenAI\": {\n  \"ApiKey\": \"your-api-key\",\n  \"Model\": \"gpt-3.5-turbo\"\n}\n```";
        }
        if (prompt.Contains("Fix"))
        {
            return "**Fixed Code (Mock)**\n\nThis is a mock response. Please configure your OpenAI API key for real code fixes.";
        }
        if (prompt.Contains("Generate"))
        {
            return "// Mock generated code\n// Configure OpenAI API key for real code generation\nfunction example() {\n  console.log('Hello, World!');\n}";
        }
        if (prompt.Contains("Document"))
        {
            return "/**\n * Mock Documentation\n * Configure OpenAI API key for real documentation generation.\n */";
        }
        if (prompt.Contains("Refactor") || prompt.Contains("Optimize"))
        {
            return "// Mock optimized/refactored code\n// Configure OpenAI API key for real optimization";
        }

        return "Mock AI response. Configure OpenAI API key in appsettings.json.";
    }

    #endregion

    #region Response Models

    private class OpenAIResponse
    {
        public List<Choice>? Choices { get; set; }
        public Usage? Usage { get; set; }
    }

    private class Choice
    {
        public Message? Message { get; set; }
    }

    private class Message
    {
        public string? Content { get; set; }
    }

    private class Usage
    {
        public int TotalTokens { get; set; }
    }

    #endregion
}
