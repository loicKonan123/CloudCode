using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Projects;

/// <summary>
/// DTO de réponse pour un projet.
/// </summary>
public class ProjectResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProgrammingLanguage Language { get; set; }
    public bool IsPublic { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Propriétaire
    public ProjectOwnerDto Owner { get; set; } = null!;

    // Statistiques
    public int FileCount { get; set; }
    public int CollaboratorCount { get; set; }
}

/// <summary>
/// Informations du propriétaire du projet.
/// </summary>
public class ProjectOwnerDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
}

/// <summary>
/// DTO pour la liste des projets (vue simplifiée).
/// </summary>
public class ProjectListItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProgrammingLanguage Language { get; set; }
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public string OwnerUsername { get; set; } = string.Empty;
}
