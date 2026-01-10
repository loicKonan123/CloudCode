using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Représente une dépendance (package) d'un projet.
/// </summary>
public class ProjectDependency : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Version { get; set; }
    public DependencyType Type { get; set; }
    public bool IsInstalled { get; set; }
    public DateTime? InstalledAt { get; set; }

    // Navigation property
    public virtual Project Project { get; set; } = null!;
}
