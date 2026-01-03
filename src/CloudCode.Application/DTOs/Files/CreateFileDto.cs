namespace CloudCode.Application.DTOs.Files;

/// <summary>
/// DTO pour la création d'un fichier ou dossier.
/// </summary>
public class CreateFileDto
{
    public string Name { get; set; } = string.Empty;
    public string? Content { get; set; }
    public bool IsFolder { get; set; }
    public Guid? ParentId { get; set; } // null = racine du projet
}

/// <summary>
/// DTO pour l'upload d'un fichier.
/// </summary>
public class UploadFileDto
{
    public string Name { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty; // Base64 ou texte
    public Guid? ParentId { get; set; }
}
