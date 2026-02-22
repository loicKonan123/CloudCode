using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service de gestion des variables d'environnement.
/// </summary>
public class EnvironmentService : IEnvironmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EnvironmentService> _logger;

    public EnvironmentService(
        ApplicationDbContext context,
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        ILogger<EnvironmentService> logger)
    {
        _context = context;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<IEnumerable<EnvironmentVariable>> GetAllAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        await ValidateProjectAccessAsync(projectId, userId, cancellationToken);

        return await _context.EnvironmentVariables
            .Where(e => e.ProjectId == projectId)
            .OrderBy(e => e.Key)
            .ToListAsync(cancellationToken);
    }

    public async Task<EnvironmentVariable> GetByIdAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var envVar = await _context.EnvironmentVariables
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            ?? throw new NotFoundException("ENV_VAR_NOT_FOUND", "Variable d'environnement non trouvée.");

        await ValidateProjectAccessAsync(envVar.ProjectId, userId, cancellationToken);

        return envVar;
    }

    public async Task<EnvironmentVariable> CreateAsync(Guid projectId, Guid userId, string key, string value, bool isSecret, CancellationToken cancellationToken = default)
    {
        await ValidateProjectWriteAccessAsync(projectId, userId, cancellationToken);

        // Vérifier que la clé n'existe pas déjà
        var existing = await _context.EnvironmentVariables
            .FirstOrDefaultAsync(e => e.ProjectId == projectId && e.Key == key, cancellationToken);

        if (existing != null)
            throw new ConflictException("ENV_VAR_EXISTS", $"La variable '{key}' existe déjà.");

        var envVar = new EnvironmentVariable
        {
            ProjectId = projectId,
            Key = key.Trim().ToUpperInvariant(),
            Value = value,
            IsSecret = isSecret
        };

        _context.EnvironmentVariables.Add(envVar);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Variable d'environnement {Key} créée pour le projet {ProjectId}", key, projectId);

        return envVar;
    }

    public async Task<EnvironmentVariable> UpdateAsync(Guid id, Guid userId, string? key, string? value, bool? isSecret, CancellationToken cancellationToken = default)
    {
        var envVar = await _context.EnvironmentVariables
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            ?? throw new NotFoundException("ENV_VAR_NOT_FOUND", "Variable d'environnement non trouvée.");

        await ValidateProjectWriteAccessAsync(envVar.ProjectId, userId, cancellationToken);

        if (!string.IsNullOrEmpty(key))
        {
            var newKey = key.Trim().ToUpperInvariant();

            // Vérifier que la nouvelle clé n'existe pas déjà
            var existing = await _context.EnvironmentVariables
                .FirstOrDefaultAsync(e => e.ProjectId == envVar.ProjectId && e.Key == newKey && e.Id != id, cancellationToken);

            if (existing != null)
                throw new ConflictException("ENV_VAR_EXISTS", $"La variable '{newKey}' existe déjà.");

            envVar.Key = newKey;
        }

        if (value != null)
            envVar.Value = value;

        if (isSecret.HasValue)
            envVar.IsSecret = isSecret.Value;

        envVar.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Variable d'environnement {Id} mise à jour pour le projet {ProjectId}", id, envVar.ProjectId);

        return envVar;
    }

    public async Task DeleteAsync(Guid id, Guid userId, CancellationToken cancellationToken = default)
    {
        var envVar = await _context.EnvironmentVariables
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken)
            ?? throw new NotFoundException("ENV_VAR_NOT_FOUND", "Variable d'environnement non trouvée.");

        await ValidateProjectWriteAccessAsync(envVar.ProjectId, userId, cancellationToken);

        _context.EnvironmentVariables.Remove(envVar);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Variable d'environnement {Key} supprimée pour le projet {ProjectId}", envVar.Key, envVar.ProjectId);
    }

    public async Task<string> GenerateEnvFileContentAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        await ValidateProjectAccessAsync(projectId, userId, cancellationToken);

        var envVars = await _context.EnvironmentVariables
            .Where(e => e.ProjectId == projectId)
            .OrderBy(e => e.Key)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("# Generated by CloudCode");
        sb.AppendLine($"# Project: {projectId}");
        sb.AppendLine($"# Generated at: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC");
        sb.AppendLine();

        foreach (var envVar in envVars)
        {
            // Échapper les valeurs si nécessaire
            var value = envVar.Value;
            if (value.Contains(' ') || value.Contains('"') || value.Contains('\'') || value.Contains('\n'))
            {
                value = $"\"{value.Replace("\"", "\\\"")}\"";
            }
            sb.AppendLine($"{envVar.Key}={value}");
        }

        return sb.ToString();
    }

    public async Task WriteEnvFileAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        await ValidateProjectWriteAccessAsync(projectId, userId, cancellationToken);

        var content = await GenerateEnvFileContentAsync(projectId, userId, cancellationToken);

        var workDir = GetProjectWorkingDirectory(projectId);
        Directory.CreateDirectory(workDir);

        var envFilePath = Path.Combine(workDir, ".env");
        await File.WriteAllTextAsync(envFilePath, content, cancellationToken);

        _logger.LogInformation("Fichier .env écrit pour le projet {ProjectId}", projectId);
    }

    #region Private Methods

    private async Task ValidateProjectAccessAsync(Guid projectId, Guid userId, CancellationToken cancellationToken)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (!project.IsPublic && project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null)
                throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
        }
    }

    private async Task ValidateProjectWriteAccessAsync(Guid projectId, Guid userId, CancellationToken cancellationToken)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null || userRole == CollaboratorRole.Read)
                throw new UnauthorizedException("NOT_AUTHORIZED", "Vous n'avez pas les droits pour modifier ce projet.");
        }
    }

    private string GetProjectWorkingDirectory(Guid projectId)
    {
        var baseDir = _configuration.GetValue<string>("Terminal:WorkingDirectory");
        if (string.IsNullOrEmpty(baseDir))
            baseDir = Path.Combine(Path.GetTempPath(), "cloudcode_projects");

        return Path.Combine(baseDir, projectId.ToString());
    }

    #endregion
}
