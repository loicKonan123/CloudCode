using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Représente un fichier ou dossier dans un projet.
/// Structure hiérarchique avec parent/children.
/// </summary>
public class CodeFile : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Path { get; set; } = string.Empty; // Chemin relatif dans le projet (ex: "src/utils/helper.js")
    public string Content { get; set; } = string.Empty;
    public bool IsFolder { get; set; }
    public Guid? ParentId { get; set; } // null = racine du projet
    public Guid ProjectId { get; set; }

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual CodeFile? Parent { get; set; }
    public virtual ICollection<CodeFile> Children { get; set; } = new List<CodeFile>();
}
