using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Execution;

/// <summary>
/// DTO de réponse pour un résultat d'exécution.
/// </summary>
public class ExecutionResultDto
{
    public Guid Id { get; set; }
    public string? Output { get; set; }
    public string? ErrorOutput { get; set; }
    public int ExitCode { get; set; }
    public ExecutionStatus Status { get; set; }
    public double ExecutionTimeMs { get; set; }
    public long MemoryUsedBytes { get; set; }
    public DateTime ExecutedAt { get; set; }
}

/// <summary>
/// DTO pour l'historique des exécutions.
/// </summary>
public class ExecutionHistoryItemDto
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = string.Empty;
    public ProgrammingLanguage Language { get; set; }
    public ExecutionStatus Status { get; set; }
    public int ExitCode { get; set; }
    public double ExecutionTimeMs { get; set; }
    public DateTime ExecutedAt { get; set; }
}
