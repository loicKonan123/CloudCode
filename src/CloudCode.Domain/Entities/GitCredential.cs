using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Credentials Git (personal access token) d'un utilisateur pour un provider (GitHub, GitLab...).
/// </summary>
public class GitCredential : BaseEntity
{
    public Guid UserId { get; set; }
    public string Provider { get; set; } = string.Empty; // "github", "gitlab", "bitbucket"
    public string Token { get; set; } = string.Empty;    // Personal Access Token
    public string Username { get; set; } = string.Empty; // Username for commits/push

    public virtual User User { get; set; } = null!;
}
