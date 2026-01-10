using CloudCode.Application.DTOs.Dependencies;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service de gestion des dépendances (packages) des projets.
/// </summary>
public interface IDependencyService
{
    Task<DependencyResponseDto> AddAsync(Guid projectId, Guid userId, AddDependencyDto dto, CancellationToken cancellationToken = default);
    Task<ProjectDependenciesDto> GetProjectDependenciesAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid projectId, Guid dependencyId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> InstallDependenciesAsync(Guid projectId, CancellationToken cancellationToken = default);
}
