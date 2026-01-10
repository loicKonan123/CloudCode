using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Dependencies;

/// <summary>
/// DTO pour ajouter une dépendance.
/// </summary>
public class AddDependencyDto
{
    public string Name { get; set; } = string.Empty;
    public string? Version { get; set; }
}

/// <summary>
/// DTO de réponse pour une dépendance.
/// </summary>
public class DependencyResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Version { get; set; }
    public DependencyType Type { get; set; }
    public bool IsInstalled { get; set; }
    public DateTime? InstalledAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO pour la liste des dépendances d'un projet.
/// </summary>
public class ProjectDependenciesDto
{
    public Guid ProjectId { get; set; }
    public DependencyType DefaultType { get; set; }
    public List<DependencyResponseDto> Dependencies { get; set; } = new();
}
