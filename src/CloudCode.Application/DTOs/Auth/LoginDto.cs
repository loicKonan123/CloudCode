namespace CloudCode.Application.DTOs.Auth;

/// <summary>
/// DTO pour la connexion d'un utilisateur.
/// </summary>
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public bool RememberMe { get; set; }
}
