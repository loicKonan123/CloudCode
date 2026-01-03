namespace CloudCode.Application.DTOs.Auth;

/// <summary>
/// DTO pour la demande de réinitialisation de mot de passe.
/// </summary>
public class ForgotPasswordDto
{
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour la réinitialisation effective du mot de passe.
/// </summary>
public class ResetPasswordDto
{
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour le changement de mot de passe (utilisateur connecté).
/// </summary>
public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
    public string ConfirmPassword { get; set; } = string.Empty;
}
