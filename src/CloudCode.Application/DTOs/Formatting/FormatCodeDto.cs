using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Formatting;

/// <summary>
/// DTO pour la requête de formatage de code.
/// </summary>
public class FormatCodeDto
{
    /// <summary>
    /// Le code à formater.
    /// </summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>
    /// Le langage de programmation.
    /// </summary>
    public ProgrammingLanguage Language { get; set; }

    /// <summary>
    /// Taille des tabulations (optionnel, défaut: 2).
    /// </summary>
    public int TabSize { get; set; } = 2;

    /// <summary>
    /// Utiliser des espaces au lieu des tabulations.
    /// </summary>
    public bool UseTabs { get; set; } = false;
}

/// <summary>
/// DTO pour la réponse de formatage de code.
/// </summary>
public class FormatCodeResultDto
{
    /// <summary>
    /// Le code formaté.
    /// </summary>
    public string FormattedCode { get; set; } = string.Empty;

    /// <summary>
    /// Indique si le formatage a réussi.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// Message d'erreur en cas d'échec.
    /// </summary>
    public string? Error { get; set; }
}
