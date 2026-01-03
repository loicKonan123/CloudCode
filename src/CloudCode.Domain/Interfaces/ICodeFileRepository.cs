using CloudCode.Domain.Entities;

namespace CloudCode.Domain.Interfaces;

/// <summary>
/// Repository spécifique pour les opérations sur les fichiers de code.
/// </summary>
public interface ICodeFileRepository : IRepository<CodeFile>
{
    Task<IEnumerable<CodeFile>> GetByProjectIdAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<CodeFile?> GetByPathAsync(Guid projectId, string path, CancellationToken cancellationToken = default);
    Task<IEnumerable<CodeFile>> GetRootFilesAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<IEnumerable<CodeFile>> GetChildrenAsync(Guid parentId, CancellationToken cancellationToken = default);
    Task<IEnumerable<CodeFile>> GetFileTreeAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<bool> PathExistsAsync(Guid projectId, string path, CancellationToken cancellationToken = default);
}
