using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Représente un projet de code (workspace) dans CloudCode.
/// </summary>
public class Project : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProgrammingLanguage Language { get; set; }
    public bool IsPublic { get; set; }
    public Guid OwnerId { get; set; }
    public string? Tags { get; set; } // JSON array of tags

    // Navigation properties
    public virtual User Owner { get; set; } = null!;
    public virtual ICollection<CodeFile> Files { get; set; } = new List<CodeFile>();
    public virtual ICollection<Collaboration> Collaborators { get; set; } = new List<Collaboration>();
    public virtual ICollection<ExecutionResult> ExecutionResults { get; set; } = new List<ExecutionResult>();
}
