namespace CloudCode.Application.DTOs.Auth;

/// <summary>
/// DTO de réponse après authentification réussie.
/// Contient les tokens JWT et les informations utilisateur.
/// </summary>
public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserInfoDto User { get; set; } = null!;
}

/// <summary>
/// Informations basiques de l'utilisateur retournées après auth.
/// </summary>
public class UserInfoDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
}
