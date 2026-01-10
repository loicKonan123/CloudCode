using CloudCode.Application.DTOs.Dependencies;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service de gestion des dépendances (packages) des projets.
/// </summary>
public class DependencyService : IDependencyService
{
    private readonly IUnitOfWork _unitOfWork;

    public DependencyService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<DependencyResponseDto> AddAsync(Guid projectId, Guid userId, AddDependencyDto dto, CancellationToken cancellationToken = default)
    {
        // Vérifier que le projet existe
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Vérifier l'accès au projet (propriétaire ou collaborateur avec droits d'écriture)
        if (project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null || userRole == CollaboratorRole.Read)
            {
                throw new UnauthorizedException("NOT_AUTHORIZED", "Vous n'avez pas les droits pour modifier ce projet.");
            }
        }

        // Vérifier que la dépendance n'existe pas déjà
        var existing = await _unitOfWork.Dependencies.GetByProjectAndNameAsync(projectId, dto.Name, cancellationToken);
        if (existing != null)
        {
            throw new ConflictException("DEPENDENCY_EXISTS", "Cette dépendance existe déjà dans le projet.");
        }

        // Déterminer le type de dépendance basé sur le langage du projet
        var dependencyType = GetDependencyTypeForLanguage(project.Language);

        var dependency = new ProjectDependency
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = dto.Name.Trim(),
            Version = dto.Version?.Trim(),
            Type = dependencyType,
            IsInstalled = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Dependencies.AddAsync(dependency, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponseDto(dependency);
    }

    public async Task<ProjectDependenciesDto> GetProjectDependenciesAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        // Vérifier que le projet existe
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Vérifier l'accès au projet
        if (!project.IsPublic && project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null)
            {
                throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
            }
        }

        var dependencies = await _unitOfWork.Dependencies.GetByProjectIdAsync(projectId, cancellationToken);

        return new ProjectDependenciesDto
        {
            ProjectId = projectId,
            DefaultType = GetDependencyTypeForLanguage(project.Language),
            Dependencies = dependencies.Select(MapToResponseDto).ToList()
        };
    }

    public async Task RemoveAsync(Guid projectId, Guid dependencyId, Guid userId, CancellationToken cancellationToken = default)
    {
        // Vérifier que le projet existe
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Vérifier l'accès au projet
        if (project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null || userRole == CollaboratorRole.Read)
            {
                throw new UnauthorizedException("NOT_AUTHORIZED", "Vous n'avez pas les droits pour modifier ce projet.");
            }
        }

        var dependency = await _unitOfWork.Dependencies.GetByIdAsync(dependencyId, cancellationToken)
            ?? throw new NotFoundException("DEPENDENCY_NOT_FOUND", "Dépendance non trouvée.");

        if (dependency.ProjectId != projectId)
        {
            throw new NotFoundException("DEPENDENCY_NOT_FOUND", "Dépendance non trouvée dans ce projet.");
        }

        _unitOfWork.Dependencies.Remove(dependency);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<bool> InstallDependenciesAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        var dependencies = await _unitOfWork.Dependencies.GetByProjectIdAsync(projectId, cancellationToken);

        // Marquer toutes les dépendances comme installées
        foreach (var dep in dependencies)
        {
            dep.IsInstalled = true;
            dep.InstalledAt = DateTime.UtcNow;
            _unitOfWork.Dependencies.Update(dep);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static DependencyType GetDependencyTypeForLanguage(ProgrammingLanguage language)
    {
        return language switch
        {
            ProgrammingLanguage.Python => DependencyType.Pip,
            ProgrammingLanguage.JavaScript => DependencyType.Npm,
            ProgrammingLanguage.TypeScript => DependencyType.Npm,
            ProgrammingLanguage.Rust => DependencyType.Cargo,
            ProgrammingLanguage.Go => DependencyType.Go,
            _ => DependencyType.Pip // Default to pip for unsupported languages
        };
    }

    private static DependencyResponseDto MapToResponseDto(ProjectDependency dependency)
    {
        return new DependencyResponseDto
        {
            Id = dependency.Id,
            Name = dependency.Name,
            Version = dependency.Version,
            Type = dependency.Type,
            IsInstalled = dependency.IsInstalled,
            InstalledAt = dependency.InstalledAt,
            CreatedAt = dependency.CreatedAt
        };
    }
}
