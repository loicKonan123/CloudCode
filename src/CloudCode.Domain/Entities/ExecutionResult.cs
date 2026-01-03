using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Représente le résultat d'une exécution de code.
/// Stocke stdout, stderr, exit code et métriques.
/// </summary>
public class ExecutionResult : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Guid FileId { get; set; }
    public Guid UserId { get; set; }
    public ProgrammingLanguage Language { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Output { get; set; } // stdout
    public string? ErrorOutput { get; set; } // stderr
    public int ExitCode { get; set; }
    public ExecutionStatus Status { get; set; }
    public TimeSpan ExecutionTime { get; set; }
    public long MemoryUsedBytes { get; set; }

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual CodeFile File { get; set; } = null!;
    public virtual User User { get; set; } = null!;
}
