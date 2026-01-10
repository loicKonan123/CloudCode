namespace CloudCode.Domain.Interfaces;

/// <summary>
/// Unit of Work pattern pour gérer les transactions globales.
/// Coordonne les changements entre plusieurs repositories.
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IProjectRepository Projects { get; }
    ICodeFileRepository Files { get; }
    ICollaborationRepository Collaborations { get; }
    IProjectDependencyRepository Dependencies { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync(CancellationToken cancellationToken = default);
    Task CommitTransactionAsync(CancellationToken cancellationToken = default);
    Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
}
