using CloudCode.Application.DTOs.Dependencies;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service de gestion des dépendances (packages) des projets.
/// </summary>
public interface IDependencyService
{
    /// <summary>
    /// Ajouter une dépendance au projet.
    /// </summary>
    Task<DependencyResponseDto> AddAsync(Guid projectId, Guid userId, AddDependencyDto dto, CancellationToken cancellationToken = default);

    /// <summary>
    /// Récupérer les dépendances d'un projet.
    /// </summary>
    Task<ProjectDependenciesDto> GetProjectDependenciesAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Supprimer une dépendance du projet.
    /// </summary>
    Task RemoveAsync(Guid projectId, Guid dependencyId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Installer les dépendances d'un projet (pip install / npm install).
    /// Crée automatiquement un venv pour Python si nécessaire.
    /// </summary>
    Task<InstallResultDto> InstallDependenciesAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Créer un environnement virtuel Python pour un projet.
    /// </summary>
    Task<bool> CreatePythonVenvAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Initialiser un projet Node.js (npm init).
    /// </summary>
    Task<bool> InitNodeProjectAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Vérifier l'environnement serveur (Python, Node.js disponibles).
    /// </summary>
    Task<EnvironmentStatusDto> CheckEnvironmentAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Obtenir les informations sur l'environnement d'un projet (venv, node_modules).
    /// </summary>
    Task<ProjectEnvironmentDto> GetProjectEnvironmentAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
}
