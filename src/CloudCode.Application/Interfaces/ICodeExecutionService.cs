using CloudCode.Application.DTOs.Execution;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service d'exécution de code dans un environnement sandboxé.
/// </summary>
public interface ICodeExecutionService
{
    Task<ExecutionResultDto> ExecuteAsync(Guid userId, ExecuteCodeDto dto, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExecutionHistoryItemDto>> GetHistoryAsync(Guid projectId, Guid userId, int limit = 20, CancellationToken cancellationToken = default);
    Task CancelExecutionAsync(Guid executionId, CancellationToken cancellationToken = default);
}
