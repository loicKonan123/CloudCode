using CloudCode.Domain.Entities;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service de gestion des variables d'environnement.
/// </summary>
public interface IEnvironmentService
{
    Task<IEnumerable<EnvironmentVariable>> GetAllAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<EnvironmentVariable> GetByIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);
    Task<EnvironmentVariable> CreateAsync(Guid projectId, Guid userId, string key, string value, bool isSecret, CancellationToken cancellationToken = default);
    Task<EnvironmentVariable> UpdateAsync(Guid id, Guid userId, string? key, string? value, bool? isSecret, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Génère le contenu du fichier .env pour un projet.
    /// </summary>
    Task<string> GenerateEnvFileContentAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);

    /// <summary>
    /// Écrit le fichier .env dans le répertoire de travail du projet.
    /// </summary>
    Task WriteEnvFileAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
}
