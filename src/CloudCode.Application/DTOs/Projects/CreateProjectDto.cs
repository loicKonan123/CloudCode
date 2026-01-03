using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Projects;

/// <summary>
/// DTO pour la création d'un nouveau projet.
/// </summary>
public class CreateProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProgrammingLanguage Language { get; set; }
    public bool IsPublic { get; set; }
    public List<string>? Tags { get; set; }
}
