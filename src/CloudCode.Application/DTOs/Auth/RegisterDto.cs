namespace CloudCode.Application.DTOs.Auth;

/// <summary>
/// DTO pour l'inscription d'un nouvel utilisateur.
/// </summary>
public class RegisterDto
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
