using CloudCode.Domain.Entities;

namespace CloudCode.Domain.Interfaces;

/// <summary>
/// Repository spécifique pour les opérations sur les dépendances de projet.
/// </summary>
public interface IProjectDependencyRepository : IRepository<ProjectDependency>
{
    Task<IEnumerable<ProjectDependency>> GetByProjectIdAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<ProjectDependency?> GetByProjectAndNameAsync(Guid projectId, string name, CancellationToken cancellationToken = default);
}
