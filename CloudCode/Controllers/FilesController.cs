using CloudCode.Application.DTOs.Files;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur de gestion des fichiers et dossiers.
/// </summary>
[Authorize]
public class FilesController : BaseApiController
{
    private readonly IFileService _fileService;

    public FilesController(IFileService fileService)
    {
        _fileService = fileService;
    }

    /// <summary>
    /// Récupérer l'arborescence des fichiers d'un projet.
    /// </summary>
    [HttpGet("project/{projectId:guid}/tree")]
    [ProducesResponseType(typeof(IEnumerable<FileTreeItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<FileTreeItemDto>>> GetFileTree(Guid projectId)
    {
        var userId = GetRequiredUserId();
        var tree = await _fileService.GetFileTreeAsync(projectId, userId);
        return Ok(tree);
    }

    /// <summary>
    /// Récupérer un fichier par son ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(FileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<FileResponseDto>> GetFile(Guid id)
    {
        var userId = GetRequiredUserId();
        var file = await _fileService.GetByIdAsync(id, userId);
        return Ok(file);
    }

    /// <summary>
    /// Récupérer un fichier par son chemin.
    /// </summary>
    [HttpGet("project/{projectId:guid}/path")]
    [ProducesResponseType(typeof(FileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FileResponseDto>> GetFileByPath(Guid projectId, [FromQuery] string path)
    {
        var userId = GetRequiredUserId();
        var file = await _fileService.GetByPathAsync(projectId, path, userId);
        return Ok(file);
    }

    /// <summary>
    /// Créer un nouveau fichier ou dossier.
    /// </summary>
    [HttpPost("project/{projectId:guid}")]
    [ProducesResponseType(typeof(FileResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<FileResponseDto>> CreateFile(Guid projectId, [FromBody] CreateFileDto dto)
    {
        var userId = GetRequiredUserId();
        var file = await _fileService.CreateAsync(projectId, userId, dto);

        return CreatedAtAction(
            nameof(GetFile),
            new { id = file.Id },
            file);
    }

    /// <summary>
    /// Mettre à jour le contenu d'un fichier.
    /// </summary>
    [HttpPut("{id:guid}/content")]
    [ProducesResponseType(typeof(FileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<FileResponseDto>> UpdateFileContent(Guid id, [FromBody] UpdateFileContentDto dto)
    {
        var userId = GetRequiredUserId();
        var file = await _fileService.UpdateContentAsync(id, userId, dto);
        return Ok(file);
    }

    /// <summary>
    /// Renommer un fichier ou dossier.
    /// </summary>
    [HttpPut("{id:guid}/rename")]
    [ProducesResponseType(typeof(FileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FileResponseDto>> RenameFile(Guid id, [FromBody] RenameFileDto dto)
    {
        var userId = GetRequiredUserId();
        var file = await _fileService.RenameAsync(id, userId, dto);
        return Ok(file);
    }

    /// <summary>
    /// Déplacer un fichier ou dossier.
    /// </summary>
    [HttpPut("{id:guid}/move")]
    [ProducesResponseType(typeof(FileResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FileResponseDto>> MoveFile(Guid id, [FromBody] MoveFileDto dto)
    {
        var userId = GetRequiredUserId();
        var file = await _fileService.MoveAsync(id, userId, dto);
        return Ok(file);
    }

    /// <summary>
    /// Copier un fichier ou dossier.
    /// </summary>
    [HttpPost("{id:guid}/copy")]
    [ProducesResponseType(typeof(FileResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FileResponseDto>> CopyFile(Guid id, [FromQuery] Guid? targetParentId = null)
    {
        var userId = GetRequiredUserId();
        var copy = await _fileService.CopyAsync(id, userId, targetParentId);

        return CreatedAtAction(
            nameof(GetFile),
            new { id = copy.Id },
            copy);
    }

    /// <summary>
    /// Supprimer un fichier ou dossier.
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DeleteFile(Guid id)
    {
        var userId = GetRequiredUserId();
        await _fileService.DeleteAsync(id, userId);
        return NoContent();
    }

    /// <summary>
    /// Télécharger un projet en ZIP.
    /// </summary>
    [HttpGet("project/{projectId:guid}/download")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> DownloadProject(Guid projectId)
    {
        var userId = GetRequiredUserId();
        var zipBytes = await _fileService.DownloadProjectAsZipAsync(projectId, userId);

        return File(zipBytes, "application/zip", $"project-{projectId}.zip");
    }
}
