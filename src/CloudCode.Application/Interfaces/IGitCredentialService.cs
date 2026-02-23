using CloudCode.Domain.Entities;

namespace CloudCode.Application.Interfaces;

public class GitCredentialDto
{
    public string Provider { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    // Token n'est pas exposé en lecture
}

/// <summary>
/// Service de gestion des credentials Git (tokens PAT).
/// </summary>
public interface IGitCredentialService
{
    Task<GitCredential?> GetCredentialAsync(Guid userId, CancellationToken ct = default);
    Task<GitCredentialDto> SaveCredentialAsync(Guid userId, string provider, string token, string username, CancellationToken ct = default);
    Task DeleteCredentialAsync(Guid userId, CancellationToken ct = default);
}
