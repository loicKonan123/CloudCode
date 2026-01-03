namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service d'assistance IA pour le code.
/// </summary>
public interface IAIService
{
    Task<string> ExplainCodeAsync(string code, string language, CancellationToken cancellationToken = default);
    Task<string> FixCodeAsync(string code, string error, string language, CancellationToken cancellationToken = default);
    Task<string> GenerateCodeAsync(string prompt, string language, CancellationToken cancellationToken = default);
    Task<IEnumerable<string>> GetCompletionsAsync(string code, int cursorPosition, string language, CancellationToken cancellationToken = default);
    Task<string> DocumentCodeAsync(string code, string language, CancellationToken cancellationToken = default);
    Task<string> RefactorCodeAsync(string code, string instructions, string language, CancellationToken cancellationToken = default);
    Task<string> OptimizeCodeAsync(string code, string language, CancellationToken cancellationToken = default);
}
