using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace CloudCode.Controllers;

public class CommitDto { public string Message { get; set; } = string.Empty; }
public class CheckoutDto { public string Branch { get; set; } = string.Empty; public bool Create { get; set; } }
public class RemoteDto { public string Url { get; set; } = string.Empty; }
public class PushPullDto { public string Branch { get; set; } = "main"; }

/// <summary>
/// Contrôleur Git : status, diff, stage, commit, push, pull, branches.
/// </summary>
[Authorize]
[Route("api/projects/{projectId:guid}/git")]
[ApiController]
public class GitController : BaseApiController
{
    private readonly IGitService _gitService;
    private readonly IFileService _fileService;
    private readonly IGitCredentialService _credentialService;
    private readonly IConfiguration _configuration;

    public GitController(
        IGitService gitService,
        IFileService fileService,
        IGitCredentialService credentialService,
        IConfiguration configuration)
    {
        _gitService = gitService;
        _fileService = fileService;
        _credentialService = credentialService;
        _configuration = configuration;
    }

    private string GetProjectDir(Guid projectId)
    {
        var configuredDir = _configuration.GetValue<string>("Terminal:WorkingDirectory");
        var baseDir = !string.IsNullOrEmpty(configuredDir)
            ? configuredDir
            : Path.Combine(Path.GetTempPath(), "cloudcode_projects");
        return Path.Combine(baseDir, projectId.ToString());
    }

    /// <summary>Initialiser le repo Git du projet.</summary>
    [HttpPost("init")]
    public async Task<ActionResult> Init(Guid projectId, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        await _fileService.SyncToWorkingDirectoryAsync(projectId, userId, ct);
        var result = await _gitService.InitAsync(GetProjectDir(projectId), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Status du repo.</summary>
    [HttpGet("status")]
    public async Task<ActionResult<GitStatusDto>> Status(Guid projectId, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        await _fileService.SyncToWorkingDirectoryAsync(projectId, userId, ct);
        var status = await _gitService.GetStatusAsync(GetProjectDir(projectId), ct);
        return Ok(status);
    }

    /// <summary>Diff du repo ou d'un fichier.</summary>
    [HttpGet("diff")]
    public async Task<ActionResult> Diff(Guid projectId, [FromQuery] string? file, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        await _fileService.SyncToWorkingDirectoryAsync(projectId, userId, ct);
        var diff = await _gitService.GetDiffAsync(GetProjectDir(projectId), file, ct);
        return Ok(new { diff });
    }

    /// <summary>Stager tous les fichiers.</summary>
    [HttpPost("stage")]
    public async Task<ActionResult> StageAll(Guid projectId, CancellationToken ct)
    {
        var result = await _gitService.StageAllAsync(GetProjectDir(projectId), ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Stager un fichier spécifique.</summary>
    [HttpPost("stage/{*filePath}")]
    public async Task<ActionResult> StageFile(Guid projectId, string filePath, CancellationToken ct)
    {
        var result = await _gitService.StageFileAsync(GetProjectDir(projectId), filePath, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Unstager un fichier.</summary>
    [HttpPost("unstage/{*filePath}")]
    public async Task<ActionResult> UnstageFile(Guid projectId, string filePath, CancellationToken ct)
    {
        var result = await _gitService.UnstageFileAsync(GetProjectDir(projectId), filePath, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Commiter les changements stagés.</summary>
    [HttpPost("commit")]
    public async Task<ActionResult> Commit(Guid projectId, [FromBody] CommitDto dto, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var cred = await _credentialService.GetCredentialAsync(userId, ct);
        var authorName = cred?.Username ?? "CloudCode User";
        var authorEmail = cred != null ? $"{cred.Username}@users.noreply.github.com" : "user@cloudcode.ide";

        var result = await _gitService.CommitAsync(GetProjectDir(projectId), dto.Message, authorName, authorEmail, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Pusher vers le remote.</summary>
    [HttpPost("push")]
    public async Task<ActionResult> Push(Guid projectId, [FromBody] PushPullDto dto, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var cred = await _credentialService.GetCredentialAsync(userId, ct)
            ?? throw new InvalidOperationException("Aucun credential Git configuré. Ajoutez votre token dans le panel Git.");

        var result = await _gitService.PushAsync(GetProjectDir(projectId), dto.Branch, cred.Token, cred.Username, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Puller depuis le remote.</summary>
    [HttpPost("pull")]
    public async Task<ActionResult> Pull(Guid projectId, [FromBody] PushPullDto dto, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var cred = await _credentialService.GetCredentialAsync(userId, ct)
            ?? throw new InvalidOperationException("Aucun credential Git configuré.");

        var result = await _gitService.PullAsync(GetProjectDir(projectId), dto.Branch, cred.Token, cred.Username, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Lister les branches.</summary>
    [HttpGet("branches")]
    public async Task<ActionResult> Branches(Guid projectId, CancellationToken ct)
    {
        var branches = await _gitService.GetBranchesAsync(GetProjectDir(projectId), ct);
        return Ok(branches);
    }

    /// <summary>Checkout / créer une branche.</summary>
    [HttpPost("checkout")]
    public async Task<ActionResult> Checkout(Guid projectId, [FromBody] CheckoutDto dto, CancellationToken ct)
    {
        var result = await _gitService.CheckoutBranchAsync(GetProjectDir(projectId), dto.Branch, dto.Create, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Log des commits.</summary>
    [HttpGet("log")]
    public async Task<ActionResult> Log(Guid projectId, [FromQuery] int limit = 20, CancellationToken ct = default)
    {
        var log = await _gitService.GetLogAsync(GetProjectDir(projectId), limit, ct);
        return Ok(log);
    }

    /// <summary>Configurer l'URL du remote origin.</summary>
    [HttpPost("remote")]
    public async Task<ActionResult> SetRemote(Guid projectId, [FromBody] RemoteDto dto, CancellationToken ct)
    {
        var result = await _gitService.SetRemoteAsync(GetProjectDir(projectId), dto.Url, ct);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
