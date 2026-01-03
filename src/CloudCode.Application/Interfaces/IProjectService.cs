using CloudCode.Application.DTOs.Projects;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service de gestion des projets.
/// </summary>
public interface IProjectService
{
    Task<ProjectResponseDto> CreateAsync(Guid userId, CreateProjectDto dto, CancellationToken cancellationToken = default);
    Task<ProjectResponseDto> GetByIdAsync(Guid projectId, Guid? userId = null, CancellationToken cancellationToken = default);
    Task<IEnumerable<ProjectListItemDto>> GetUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<PagedResultDto<ProjectListItemDto>> GetPublicProjectsAsync(ProjectSearchDto search, CancellationToken cancellationToken = default);
    Task<PagedResultDto<ProjectListItemDto>> SearchAsync(ProjectSearchDto search, CancellationToken cancellationToken = default);
    Task<ProjectResponseDto> UpdateAsync(Guid projectId, Guid userId, UpdateProjectDto dto, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<ProjectResponseDto> DuplicateAsync(Guid projectId, Guid userId, string? newName = null, CancellationToken cancellationToken = default);
    Task<bool> UserHasAccessAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
}
