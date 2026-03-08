using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

public class VsRank : BaseEntity
{
    public Guid UserId { get; set; }
    public int Elo { get; set; } = 1000;
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int Draws { get; set; }
    public int CurrentStreak { get; set; }
    public int BestStreak { get; set; }

    // Navigation
    public virtual User User { get; set; } = null!;

    public string GetTier() => Elo switch
    {
        < 1100 => "Bronze",
        < 1250 => "Silver",
        < 1400 => "Gold",
        < 1600 => "Platinum",
        < 1800 => "Diamond",
        < 2000 => "Master",
        _ => "Grandmaster"
    };
}
