using CloudCode.Application.DTOs.Projects;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur de gestion des projets.
/// </summary>
public class ProjectsController : BaseApiController
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    /// <summary>
    /// Récupérer tous les projets de l'utilisateur connecté.
    /// </summary>
    [Authorize]
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ProjectListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ProjectListItemDto>>> GetMyProjects()
    {
        var userId = GetRequiredUserId();
        var projects = await _projectService.GetUserProjectsAsync(userId);
        return Ok(projects);
    }

    /// <summary>
    /// Récupérer les projets publics.
    /// </summary>
    [HttpGet("public")]
    [ProducesResponseType(typeof(PagedResultDto<ProjectListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<ProjectListItemDto>>> GetPublicProjects(
        [FromQuery] ProjectSearchDto search)
    {
        var result = await _projectService.GetPublicProjectsAsync(search);
        return Ok(result);
    }

    /// <summary>
    /// Rechercher des projets.
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(PagedResultDto<ProjectListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<ProjectListItemDto>>> SearchProjects(
        [FromQuery] ProjectSearchDto search)
    {
        var result = await _projectService.SearchAsync(search);
        return Ok(result);
    }

    /// <summary>
    /// Récupérer un projet par son ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ProjectResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ProjectResponseDto>> GetProject(Guid id)
    {
        var project = await _projectService.GetByIdAsync(id, CurrentUserId);
        return Ok(project);
    }

    /// <summary>
    /// Créer un nouveau projet.
    /// </summary>
    [Authorize]
    [HttpPost]
    [ProducesResponseType(typeof(ProjectResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectResponseDto>> CreateProject([FromBody] CreateProjectDto dto)
    {
        var userId = GetRequiredUserId();
        var project = await _projectService.CreateAsync(userId, dto);

        return CreatedAtAction(
            nameof(GetProject),
            new { id = project.Id },
            project);
    }

    /// <summary>
    /// Mettre à jour un projet.
    /// </summary>
    [Authorize]
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ProjectResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ProjectResponseDto>> UpdateProject(Guid id, [FromBody] UpdateProjectDto dto)
    {
        var userId = GetRequiredUserId();
        var project = await _projectService.UpdateAsync(id, userId, dto);
        return Ok(project);
    }

    /// <summary>
    /// Supprimer un projet.
    /// </summary>
    [Authorize]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteProject(Guid id)
    {
        var userId = GetRequiredUserId();
        await _projectService.DeleteAsync(id, userId);
        return NoContent();
    }

    /// <summary>
    /// Dupliquer (fork) un projet.
    /// </summary>
    [Authorize]
    [HttpPost("{id:guid}/fork")]
    [ProducesResponseType(typeof(ProjectResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ProjectResponseDto>> ForkProject(Guid id, [FromQuery] string? newName = null)
    {
        var userId = GetRequiredUserId();
        var fork = await _projectService.DuplicateAsync(id, userId, newName);

        return CreatedAtAction(
            nameof(GetProject),
            new { id = fork.Id },
            fork);
    }
}
