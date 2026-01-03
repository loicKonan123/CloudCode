using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Interfaces;

/// <summary>
/// Repository spécifique pour les opérations sur les projets.
/// </summary>
public interface IProjectRepository : IRepository<Project>
{
    Task<IEnumerable<Project>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default);
    Task<Project?> GetByIdWithOwnerAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<Project?> GetByIdWithFilesAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<Project?> GetWithCollaboratorsAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<(IEnumerable<Project> Projects, int TotalCount)> SearchAsync(
        string? searchTerm,
        ProgrammingLanguage? language,
        bool? isPublic,
        int page,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken = default);
    Task<IEnumerable<Project>> GetUserAccessibleProjectsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> UserHasAccessAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
}
