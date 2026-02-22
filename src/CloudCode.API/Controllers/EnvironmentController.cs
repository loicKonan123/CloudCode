using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur de gestion des variables d'environnement.
/// </summary>
[Authorize]
public class EnvironmentController : BaseApiController
{
    private readonly IEnvironmentService _environmentService;

    public EnvironmentController(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    /// <summary>
    /// Récupérer toutes les variables d'environnement d'un projet.
    /// </summary>
    [HttpGet("project/{projectId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<EnvironmentVariableDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EnvironmentVariableDto>>> GetAll(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var envVars = await _environmentService.GetAllAsync(projectId, userId, cancellationToken);
        return Ok(envVars.Select(MapToDto));
    }

    /// <summary>
    /// Récupérer une variable d'environnement par son ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(EnvironmentVariableDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EnvironmentVariableDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var envVar = await _environmentService.GetByIdAsync(id, userId, cancellationToken);
        return Ok(MapToDto(envVar));
    }

    /// <summary>
    /// Créer une nouvelle variable d'environnement.
    /// </summary>
    [HttpPost("project/{projectId:guid}")]
    [ProducesResponseType(typeof(EnvironmentVariableDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EnvironmentVariableDto>> Create(Guid projectId, [FromBody] CreateEnvironmentVariableDto dto, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var envVar = await _environmentService.CreateAsync(projectId, userId, dto.Key, dto.Value, dto.IsSecret, cancellationToken);
        return Created($"/api/environment/{envVar.Id}", MapToDto(envVar));
    }

    /// <summary>
    /// Mettre à jour une variable d'environnement.
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(EnvironmentVariableDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EnvironmentVariableDto>> Update(Guid id, [FromBody] UpdateEnvironmentVariableDto dto, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var envVar = await _environmentService.UpdateAsync(id, userId, dto.Key, dto.Value, dto.IsSecret, cancellationToken);
        return Ok(MapToDto(envVar));
    }

    /// <summary>
    /// Supprimer une variable d'environnement.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        await _environmentService.DeleteAsync(id, userId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// Générer le contenu du fichier .env.
    /// </summary>
    [HttpGet("project/{projectId:guid}/file")]
    [ProducesResponseType(typeof(EnvFileContentDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EnvFileContentDto>> GetEnvFileContent(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var content = await _environmentService.GenerateEnvFileContentAsync(projectId, userId, cancellationToken);
        return Ok(new EnvFileContentDto { Content = content });
    }

    /// <summary>
    /// Écrire le fichier .env dans le répertoire de travail du projet.
    /// </summary>
    [HttpPost("project/{projectId:guid}/sync")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> SyncEnvFile(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        await _environmentService.WriteEnvFileAsync(projectId, userId, cancellationToken);
        return Ok(new { message = "Fichier .env synchronisé avec succès." });
    }

    private static EnvironmentVariableDto MapToDto(EnvironmentVariable envVar)
    {
        return new EnvironmentVariableDto
        {
            Id = envVar.Id,
            Key = envVar.Key,
            Value = envVar.IsSecret ? "••••••••" : envVar.Value,
            IsSecret = envVar.IsSecret,
            CreatedAt = envVar.CreatedAt,
            UpdatedAt = envVar.UpdatedAt
        };
    }
}

// DTOs
public record CreateEnvironmentVariableDto
{
    public string Key { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public bool IsSecret { get; init; }
}

public record UpdateEnvironmentVariableDto
{
    public string? Key { get; init; }
    public string? Value { get; init; }
    public bool? IsSecret { get; init; }
}

public record EnvironmentVariableDto
{
    public Guid Id { get; init; }
    public string Key { get; init; } = string.Empty;
    public string Value { get; init; } = string.Empty;
    public bool IsSecret { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
}

public record EnvFileContentDto
{
    public string Content { get; init; } = string.Empty;
}
