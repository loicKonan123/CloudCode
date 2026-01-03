namespace CloudCode.Application.DTOs.Files;

/// <summary>
/// DTO de réponse pour un fichier (avec contenu).
/// </summary>
public class FileResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsFolder { get; set; }
    public Guid? ParentId { get; set; }
    public Guid ProjectId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// DTO pour l'arborescence de fichiers (sans contenu).
/// </summary>
public class FileTreeItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public bool IsFolder { get; set; }
    public Guid? ParentId { get; set; }
    public List<FileTreeItemDto> Children { get; set; } = new();
}

/// <summary>
/// DTO pour la liste de fichiers d'un projet (vue plate).
/// </summary>
public class FileListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty;
    public bool IsFolder { get; set; }
    public DateTime UpdatedAt { get; set; }
}
