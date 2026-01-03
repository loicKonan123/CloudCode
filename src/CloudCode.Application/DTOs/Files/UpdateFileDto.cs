namespace CloudCode.Application.DTOs.Files;

/// <summary>
/// DTO pour la mise à jour du contenu d'un fichier.
/// </summary>
public class UpdateFileContentDto
{
    public string Content { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour renommer un fichier/dossier.
/// </summary>
public class RenameFileDto
{
    public string NewName { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour déplacer un fichier/dossier.
/// </summary>
public class MoveFileDto
{
    public Guid? NewParentId { get; set; } // null = racine
}
