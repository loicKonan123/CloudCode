using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Représente un utilisateur de la plateforme CloudCode.
/// </summary>
public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Bio { get; set; }
    public bool EmailConfirmed { get; set; }
    public string? FirebaseUid { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public string? PasswordResetToken { get; set; }
    public DateTime? PasswordResetTokenExpiry { get; set; }
    public bool IsAdmin { get; set; }

    // Streak journalier
    public int ChallengeStreak { get; set; }
    public int BestChallengeStreak { get; set; }
    public DateTime? LastChallengeSolvedDate { get; set; }

    // Navigation properties
    public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    public virtual ICollection<Collaboration> Collaborations { get; set; } = new List<Collaboration>();
}
