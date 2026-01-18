using CloudCode.Application.DTOs.Dependencies;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur de gestion des dépendances (packages).
/// </summary>
[Authorize]
public class DependenciesController : BaseApiController
{
    private readonly IDependencyService _dependencyService;

    public DependenciesController(IDependencyService dependencyService)
    {
        _dependencyService = dependencyService;
    }

    /// <summary>
    /// Récupérer les dépendances d'un projet.
    /// </summary>
    [HttpGet("project/{projectId:guid}")]
    [ProducesResponseType(typeof(ProjectDependenciesDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<ProjectDependenciesDto>> GetProjectDependencies(Guid projectId)
    {
        var userId = GetRequiredUserId();
        var dependencies = await _dependencyService.GetProjectDependenciesAsync(projectId, userId);
        return Ok(dependencies);
    }

    /// <summary>
    /// Ajouter une dépendance à un projet.
    /// </summary>
    [HttpPost("project/{projectId:guid}")]
    [ProducesResponseType(typeof(DependencyResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<DependencyResponseDto>> AddDependency(Guid projectId, [FromBody] AddDependencyDto dto)
    {
        var userId = GetRequiredUserId();
        var dependency = await _dependencyService.AddAsync(projectId, userId, dto);
        return Created($"/api/dependencies/project/{projectId}", dependency);
    }

    /// <summary>
    /// Supprimer une dépendance d'un projet.
    /// </summary>
    [HttpDelete("project/{projectId:guid}/{dependencyId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> RemoveDependency(Guid projectId, Guid dependencyId)
    {
        var userId = GetRequiredUserId();
        await _dependencyService.RemoveAsync(projectId, dependencyId, userId);
        return NoContent();
    }

    /// <summary>
    /// Installer toutes les dépendances d'un projet.
    /// Crée automatiquement un venv pour Python ou package.json pour Node.js.
    /// </summary>
    [HttpPost("project/{projectId:guid}/install")]
    [ProducesResponseType(typeof(InstallResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InstallResultDto>> InstallDependencies(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var result = await _dependencyService.InstallDependenciesAsync(projectId, userId, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Créer un environnement virtuel Python pour un projet.
    /// </summary>
    [HttpPost("project/{projectId:guid}/venv")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> CreatePythonVenv(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        await _dependencyService.CreatePythonVenvAsync(projectId, userId, cancellationToken);
        return Ok(new { message = "Environnement virtuel Python créé avec succès." });
    }

    /// <summary>
    /// Initialiser un projet Node.js (créer package.json).
    /// </summary>
    [HttpPost("project/{projectId:guid}/init")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> InitNodeProject(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        await _dependencyService.InitNodeProjectAsync(projectId, userId, cancellationToken);
        return Ok(new { message = "Projet Node.js initialisé avec succès." });
    }

    /// <summary>
    /// Vérifier l'environnement serveur (Python, Node.js, npm disponibles).
    /// </summary>
    [HttpGet("environment")]
    [ProducesResponseType(typeof(EnvironmentStatusDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<EnvironmentStatusDto>> CheckEnvironment(CancellationToken cancellationToken)
    {
        var status = await _dependencyService.CheckEnvironmentAsync(cancellationToken);
        return Ok(status);
    }

    /// <summary>
    /// Obtenir les informations sur l'environnement d'un projet (venv, node_modules).
    /// </summary>
    [HttpGet("project/{projectId:guid}/environment")]
    [ProducesResponseType(typeof(ProjectEnvironmentDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ProjectEnvironmentDto>> GetProjectEnvironment(Guid projectId, CancellationToken cancellationToken)
    {
        var userId = GetRequiredUserId();
        var envInfo = await _dependencyService.GetProjectEnvironmentAsync(projectId, userId, cancellationToken);
        return Ok(envInfo);
    }
}
