using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Représente une variable d'environnement pour un projet.
/// </summary>
public class EnvironmentVariable : BaseEntity
{
    public Guid ProjectId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public bool IsSecret { get; set; }

    // Navigation property
    public virtual Project Project { get; set; } = null!;
}
