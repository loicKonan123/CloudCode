using System.ComponentModel.DataAnnotations;

namespace CloudCode.Application.DTOs.Auth;

/// <summary>
/// DTO pour la demande de réinitialisation de mot de passe.
/// </summary>
public class ForgotPasswordDto
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour la réinitialisation effective du mot de passe.
/// </summary>
public class ResetPasswordDto
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string Token { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare("NewPassword", ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}

/// <summary>
/// DTO pour le changement de mot de passe (utilisateur connecté).
/// </summary>
public class ChangePasswordDto
{
    [Required]
    [StringLength(128)]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required]
    [StringLength(128, MinimumLength = 8)]
    public string NewPassword { get; set; } = string.Empty;

    [Required]
    [Compare("NewPassword", ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
