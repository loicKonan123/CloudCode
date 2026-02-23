using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

public class SaveCredentialDto
{
    public string Provider { get; set; } = "github";
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
}

/// <summary>
/// Contrôleur de gestion des credentials Git (tokens PAT).
/// </summary>
[Authorize]
[Route("api/git/credentials")]
[ApiController]
public class GitCredentialsController : BaseApiController
{
    private readonly IGitCredentialService _credentialService;

    public GitCredentialsController(IGitCredentialService credentialService)
    {
        _credentialService = credentialService;
    }

    /// <summary>Récupérer les infos du credential (sans le token).</summary>
    [HttpGet]
    public async Task<ActionResult> Get(CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var cred = await _credentialService.GetCredentialAsync(userId, ct);
        if (cred == null) return Ok(null);
        return Ok(new GitCredentialDto { Provider = cred.Provider, Username = cred.Username });
    }

    /// <summary>Sauvegarder un credential Git.</summary>
    [HttpPost]
    public async Task<ActionResult> Save([FromBody] SaveCredentialDto dto, CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        var result = await _credentialService.SaveCredentialAsync(userId, dto.Provider, dto.Token, dto.Username, ct);
        return Ok(result);
    }

    /// <summary>Supprimer le credential.</summary>
    [HttpDelete]
    public async Task<ActionResult> Delete(CancellationToken ct)
    {
        var userId = GetRequiredUserId();
        await _credentialService.DeleteCredentialAsync(userId, ct);
        return NoContent();
    }
}
