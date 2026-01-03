namespace CloudCode.Application.DTOs.AI;

/// <summary>
/// DTO pour expliquer du code.
/// </summary>
public class ExplainCodeDto
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour corriger du code.
/// </summary>
public class FixCodeDto
{
    public string Code { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour générer du code.
/// </summary>
public class GenerateCodeDto
{
    public string Prompt { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour obtenir des suggestions d'autocomplétion.
/// </summary>
public class CompletionDto
{
    public string Code { get; set; } = string.Empty;
    public int CursorPosition { get; set; }
    public string Language { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour documenter du code.
/// </summary>
public class DocumentCodeDto
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour refactorer du code.
/// </summary>
public class RefactorCodeDto
{
    public string Code { get; set; } = string.Empty;
    public string Instructions { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour optimiser du code.
/// </summary>
public class OptimizeCodeDto
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

/// <summary>
/// Réponse IA générique.
/// </summary>
public class AIResponseDto
{
    public string Result { get; set; } = string.Empty;
    public int TokensUsed { get; set; }
    public string Model { get; set; } = string.Empty;
}

/// <summary>
/// Réponse pour les suggestions.
/// </summary>
public class CompletionResponseDto
{
    public IEnumerable<string> Suggestions { get; set; } = new List<string>();
    public int TokensUsed { get; set; }
}
