using System.ComponentModel.DataAnnotations;

namespace CloudCode.Application.DTOs.Auth;

/// <summary>
/// DTO pour la connexion d'un utilisateur.
/// </summary>
public class LoginDto
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(128)]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; }
}
