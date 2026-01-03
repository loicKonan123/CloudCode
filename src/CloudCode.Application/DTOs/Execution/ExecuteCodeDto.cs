using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Execution;

/// <summary>
/// DTO pour exécuter du code.
/// </summary>
public class ExecuteCodeDto
{
    public Guid ProjectId { get; set; }
    public Guid FileId { get; set; }
    public string Code { get; set; } = string.Empty;
    public ProgrammingLanguage Language { get; set; }
    public string? Input { get; set; } // stdin input
    public int TimeoutSeconds { get; set; } = 5;
}
