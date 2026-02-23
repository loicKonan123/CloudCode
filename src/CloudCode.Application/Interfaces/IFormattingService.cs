namespace CloudCode.Application.Interfaces;

public class FormattingResult
{
    public string FormattedCode { get; set; } = string.Empty;
    public bool Success { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Service de formatage du code source (Black, Prettier, gofmt...).
/// </summary>
public interface IFormattingService
{
    Task<FormattingResult> FormatAsync(string code, string language, CancellationToken cancellationToken = default);
}
