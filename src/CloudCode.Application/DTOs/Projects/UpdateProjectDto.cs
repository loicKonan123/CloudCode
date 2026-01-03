using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Projects;

/// <summary>
/// DTO pour la mise à jour d'un projet existant.
/// </summary>
public class UpdateProjectDto
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public ProgrammingLanguage? Language { get; set; }
    public bool? IsPublic { get; set; }
    public List<string>? Tags { get; set; }
}
