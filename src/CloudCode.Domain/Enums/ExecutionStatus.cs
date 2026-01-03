namespace CloudCode.Domain.Enums;

/// <summary>
/// Status d'exécution du code.
/// </summary>
public enum ExecutionStatus
{
    Pending = 0,
    Running = 1,
    Completed = 2,
    Failed = 3,
    Timeout = 4,
    Cancelled = 5
}
