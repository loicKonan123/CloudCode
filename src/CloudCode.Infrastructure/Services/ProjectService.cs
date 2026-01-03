using System.Text.Json;
using CloudCode.Application.DTOs.Projects;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service de gestion des projets.
/// </summary>
public class ProjectService : IProjectService
{
    private readonly IUnitOfWork _unitOfWork;

    public ProjectService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ProjectResponseDto> CreateAsync(Guid userId, CreateProjectDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Utilisateur non trouvé.");

        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Description = dto.Description,
            Language = dto.Language,
            IsPublic = dto.IsPublic,
            OwnerId = userId,
            Tags = dto.Tags != null ? JsonSerializer.Serialize(dto.Tags) : null,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Projects.AddAsync(project, cancellationToken);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(project, user);
    }

    public async Task<ProjectResponseDto> GetByIdAsync(Guid projectId, Guid? userId = null, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdWithOwnerAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Vérifier l'accès si le projet est privé
        if (!project.IsPublic && userId != project.OwnerId)
        {
            // Vérifier si l'utilisateur est collaborateur
            if (userId.HasValue)
            {
                var hasAccess = await UserHasAccessAsync(projectId, userId.Value, cancellationToken);
                if (!hasAccess)
                {
                    throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
                }
            }
            else
            {
                throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
            }
        }

        return MapToResponseDto(project, project.Owner);
    }

    public async Task<IEnumerable<ProjectListItemDto>> GetUserProjectsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var projects = await _unitOfWork.Projects.GetByOwnerIdAsync(userId, cancellationToken);

        return projects.Select(p => new ProjectListItemDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            Language = p.Language,
            IsPublic = p.IsPublic,
            CreatedAt = p.CreatedAt,
            OwnerUsername = p.Owner?.Username ?? "Unknown"
        });
    }

    public async Task<PagedResultDto<ProjectListItemDto>> GetPublicProjectsAsync(ProjectSearchDto search, CancellationToken cancellationToken = default)
    {
        search.IsPublic = true;
        return await SearchAsync(search, cancellationToken);
    }

    public async Task<PagedResultDto<ProjectListItemDto>> SearchAsync(ProjectSearchDto search, CancellationToken cancellationToken = default)
    {
        var (projects, totalCount) = await _unitOfWork.Projects.SearchAsync(
            search.SearchTerm,
            search.Language,
            search.IsPublic,
            search.Page,
            search.PageSize,
            search.SortBy,
            search.SortDescending,
            cancellationToken);

        var items = projects.Select(p => new ProjectListItemDto
        {
            Id = p.Id,
            Name = p.Name,
            Description = p.Description,
            Language = p.Language,
            IsPublic = p.IsPublic,
            CreatedAt = p.CreatedAt,
            OwnerUsername = p.Owner?.Username ?? "Unknown"
        }).ToList();

        return new PagedResultDto<ProjectListItemDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = search.Page,
            PageSize = search.PageSize
        };
    }

    public async Task<ProjectResponseDto> UpdateAsync(Guid projectId, Guid userId, UpdateProjectDto dto, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdWithOwnerAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Vérifier que l'utilisateur est le propriétaire
        if (project.OwnerId != userId)
        {
            throw new UnauthorizedException("NOT_OWNER", "Seul le propriétaire peut modifier ce projet.");
        }

        // Mettre à jour les champs
        if (dto.Name != null) project.Name = dto.Name;
        if (dto.Description != null) project.Description = dto.Description;
        if (dto.Language.HasValue) project.Language = dto.Language.Value;
        if (dto.IsPublic.HasValue) project.IsPublic = dto.IsPublic.Value;
        if (dto.Tags != null) project.Tags = JsonSerializer.Serialize(dto.Tags);

        project.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Projects.Update(project);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(project, project.Owner);
    }

    public async Task DeleteAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Vérifier que l'utilisateur est le propriétaire
        if (project.OwnerId != userId)
        {
            throw new UnauthorizedException("NOT_OWNER", "Seul le propriétaire peut supprimer ce projet.");
        }

        _unitOfWork.Projects.Remove(project);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<ProjectResponseDto> DuplicateAsync(Guid projectId, Guid userId, string? newName = null, CancellationToken cancellationToken = default)
    {
        var sourceProject = await _unitOfWork.Projects.GetByIdWithFilesAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Vérifier l'accès
        if (!sourceProject.IsPublic && sourceProject.OwnerId != userId)
        {
            var hasAccess = await UserHasAccessAsync(projectId, userId, cancellationToken);
            if (!hasAccess)
            {
                throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
            }
        }

        var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Utilisateur non trouvé.");

        // Créer le nouveau projet
        var newProject = new Project
        {
            Id = Guid.NewGuid(),
            Name = newName ?? $"{sourceProject.Name} (copie)",
            Description = sourceProject.Description,
            Language = sourceProject.Language,
            IsPublic = false, // Les copies sont privées par défaut
            OwnerId = userId,
            Tags = sourceProject.Tags,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Projects.AddAsync(newProject, cancellationToken);

        // Copier les fichiers
        foreach (var file in sourceProject.Files.Where(f => f.ParentId == null))
        {
            await CopyFileRecursively(file, newProject.Id, null, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(newProject, user);
    }

    public async Task<bool> UserHasAccessAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken);
        if (project == null) return false;

        // Le propriétaire a toujours accès
        if (project.OwnerId == userId) return true;

        // Projets publics accessibles à tous
        if (project.IsPublic) return true;

        // Vérifier si l'utilisateur est collaborateur
        var collaboration = await _unitOfWork.Collaborations.GetByProjectAndUserAsync(projectId, userId, cancellationToken);
        return collaboration != null;
    }

    private async Task CopyFileRecursively(CodeFile sourceFile, Guid newProjectId, Guid? newParentId, CancellationToken cancellationToken)
    {
        var newFile = new CodeFile
        {
            Id = Guid.NewGuid(),
            Name = sourceFile.Name,
            Path = sourceFile.Path,
            Content = sourceFile.Content,
            IsFolder = sourceFile.IsFolder,
            ProjectId = newProjectId,
            ParentId = newParentId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Files.AddAsync(newFile, cancellationToken);

        // Copier les enfants si c'est un dossier
        if (sourceFile.IsFolder && sourceFile.Children != null)
        {
            foreach (var child in sourceFile.Children)
            {
                await CopyFileRecursively(child, newProjectId, newFile.Id, cancellationToken);
            }
        }
    }

    private ProjectResponseDto MapToResponseDto(Project project, User owner)
    {
        return new ProjectResponseDto
        {
            Id = project.Id,
            Name = project.Name,
            Description = project.Description,
            Language = project.Language,
            IsPublic = project.IsPublic,
            Tags = project.Tags != null
                ? JsonSerializer.Deserialize<List<string>>(project.Tags) ?? new List<string>()
                : new List<string>(),
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
            Owner = new ProjectOwnerDto
            {
                Id = owner.Id,
                Username = owner.Username,
                Avatar = owner.Avatar
            },
            FileCount = project.Files?.Count ?? 0,
            CollaboratorCount = project.Collaborators?.Count ?? 0
        };
    }
}
