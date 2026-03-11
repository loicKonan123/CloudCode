namespace CloudCode.Application.DTOs.Users;

/// <summary>
/// DTO pour le profil utilisateur complet avec statistiques.
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

    // Challenge stats
    public int ChallengesSolved { get; set; }
    public int TotalScore { get; set; }
    public int TotalSubmissions { get; set; }
    public int EasySolved { get; set; }
    public int MediumSolved { get; set; }
    public int HardSolved { get; set; }
    public int PythonSubmissions { get; set; }
    public int JavaScriptSubmissions { get; set; }

    // Streak
    public int ChallengeStreak { get; set; }
    public int BestChallengeStreak { get; set; }

    // VS stats
    public int Elo { get; set; } = 1000;
    public string Tier { get; set; } = "Bronze";
    public int VsWins { get; set; }
    public int VsLosses { get; set; }

    // Recent activity
    public List<RecentSubmissionDto> RecentSubmissions { get; set; } = new();

    // Heatmap — clé "yyyy-MM-dd", valeur = nb soumissions ce jour (365 derniers jours)
    public Dictionary<string, int> ActivityByDay { get; set; } = new();
}

public class RecentSubmissionDto
{
    public string ChallengeTitle { get; set; } = string.Empty;
    public string ChallengeSlug { get; set; } = string.Empty;
    public bool Passed { get; set; }
    public int Score { get; set; }
    public int Language { get; set; }
    public DateTime SubmittedAt { get; set; }
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
    public DateTime CreatedAt { get; set; }
    public int PublicProjectCount { get; set; }
    // Challenge stats
    public int ChallengesSolved { get; set; }
    public int TotalScore { get; set; }
    public int EasySolved { get; set; }
    public int MediumSolved { get; set; }
    public int HardSolved { get; set; }
    public int ChallengeStreak { get; set; }
    public int BestChallengeStreak { get; set; }
    public List<RecentSubmissionDto> RecentSubmissions { get; set; } = new();
}
