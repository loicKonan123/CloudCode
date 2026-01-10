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
}
