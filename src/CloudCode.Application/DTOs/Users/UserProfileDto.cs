namespace CloudCode.Application.DTOs.Users;

/// <summary>
/// DTO pour le profil utilisateur complet.
/// </summary>
public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Bio { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }
    public int ProjectCount { get; set; }
}

/// <summary>
/// DTO pour mettre à jour le profil utilisateur.
/// </summary>
public class UpdateProfileDto
{
    public string? Username { get; set; }
    public string? Avatar { get; set; }
    public string? Bio { get; set; }
}

/// <summary>
/// DTO pour un utilisateur public (vue limitée).
/// </summary>
public class PublicUserDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Bio { get; set; }
    public int PublicProjectCount { get; set; }
}
