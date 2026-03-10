using CloudCode.Application.DTOs.Users;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Enums;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _db;
    private readonly PasswordHasher _passwordHasher;

    public UserService(ApplicationDbContext db, PasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.FindAsync([userId], cancellationToken)
            ?? throw new KeyNotFoundException("User not found");

        // Challenge stats
        var progress = await _db.UserProgress
            .Where(p => p.UserId == userId && p.IsSolved)
            .Include(p => p.Challenge)
            .ToListAsync(cancellationToken);

        var submissions = await _db.UserSubmissions
            .Where(s => s.UserId == userId)
            .Include(s => s.Challenge)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync(cancellationToken);

        // VS stats
        var vsRank = await _db.VsRanks
            .FirstOrDefaultAsync(r => r.UserId == userId, cancellationToken);

        var recent = submissions.Take(10).Select(s => new RecentSubmissionDto
        {
            ChallengeTitle = s.Challenge?.Title ?? "",
            ChallengeSlug = s.Challenge?.Slug ?? "",
            Passed = s.Status == SubmissionStatus.Passed,
            Score = s.Score,
            Language = (int)s.Language,
            SubmittedAt = s.SubmittedAt,
        }).ToList();

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            Avatar = user.Avatar,
            Bio = user.Bio,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt,
            ChallengesSolved = progress.Count,
            TotalScore = progress.Sum(p => p.BestScore),
            TotalSubmissions = submissions.Count,
            EasySolved = progress.Count(p => p.Challenge?.Difficulty == ChallengeDifficulty.Easy),
            MediumSolved = progress.Count(p => p.Challenge?.Difficulty == ChallengeDifficulty.Medium),
            HardSolved = progress.Count(p => p.Challenge?.Difficulty == ChallengeDifficulty.Hard),
            PythonSubmissions = submissions.Count(s => s.Language == ChallengeLanguage.Python),
            JavaScriptSubmissions = submissions.Count(s => s.Language == ChallengeLanguage.JavaScript),
            ChallengeStreak = user.ChallengeStreak,
            BestChallengeStreak = user.BestChallengeStreak,
            Elo = vsRank?.Elo ?? 1000,
            Tier = vsRank?.GetTier() ?? "Bronze",
            VsWins = vsRank?.Wins ?? 0,
            VsLosses = vsRank?.Losses ?? 0,
            RecentSubmissions = recent,
        };
    }

    public async Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.FindAsync([userId], cancellationToken)
            ?? throw new KeyNotFoundException("User not found");

        if (!string.IsNullOrWhiteSpace(dto.Username) && dto.Username != user.Username)
        {
            var taken = await _db.Users.AnyAsync(u => u.Username == dto.Username && u.Id != userId, cancellationToken);
            if (taken) throw new InvalidOperationException("USERNAME_TAKEN");
            user.Username = dto.Username.Trim();
        }

        if (dto.Bio != null) user.Bio = dto.Bio;
        if (dto.Avatar != null) user.Avatar = dto.Avatar;

        await _db.SaveChangesAsync(cancellationToken);
        return await GetProfileAsync(userId, cancellationToken);
    }

    public async Task<PublicUserDto?> GetPublicProfileAsync(string username, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username, cancellationToken);
        if (user == null) return null;

        var publicProjects = await _db.Projects.CountAsync(p => p.OwnerId == user.Id && p.IsPublic, cancellationToken);

        var progress = await _db.UserProgress
            .Where(p => p.UserId == user.Id && p.IsSolved)
            .Include(p => p.Challenge)
            .ToListAsync(cancellationToken);

        var recentSubmissions = await _db.UserSubmissions
            .Where(s => s.UserId == user.Id)
            .Include(s => s.Challenge)
            .OrderByDescending(s => s.SubmittedAt)
            .Take(10)
            .ToListAsync(cancellationToken);

        return new PublicUserDto
        {
            Id = user.Id,
            Username = user.Username,
            Avatar = user.Avatar,
            Bio = user.Bio,
            CreatedAt = user.CreatedAt,
            PublicProjectCount = publicProjects,
            ChallengesSolved = progress.Count,
            TotalScore = progress.Sum(p => p.BestScore),
            EasySolved = progress.Count(p => p.Challenge?.Difficulty == ChallengeDifficulty.Easy),
            MediumSolved = progress.Count(p => p.Challenge?.Difficulty == ChallengeDifficulty.Medium),
            HardSolved = progress.Count(p => p.Challenge?.Difficulty == ChallengeDifficulty.Hard),
            ChallengeStreak = user.ChallengeStreak,
            BestChallengeStreak = user.BestChallengeStreak,
            RecentSubmissions = recentSubmissions.Select(s => new RecentSubmissionDto
            {
                ChallengeTitle = s.Challenge?.Title ?? "",
                ChallengeSlug = s.Challenge?.Slug ?? "",
                Passed = s.Status == SubmissionStatus.Passed,
                Score = s.Score,
                Language = (int)s.Language,
                SubmittedAt = s.SubmittedAt,
            }).ToList()
        };
    }

    public async Task<IEnumerable<PublicUserDto>> SearchUsersAsync(string searchTerm, int limit = 10, CancellationToken cancellationToken = default)
    {
        return await _db.Users
            .Where(u => u.Username.Contains(searchTerm))
            .Take(limit)
            .Select(u => new PublicUserDto { Id = u.Id, Username = u.Username, Avatar = u.Avatar })
            .ToListAsync(cancellationToken);
    }

    public async Task DeleteAccountAsync(Guid userId, string password, CancellationToken cancellationToken = default)
    {
        var user = await _db.Users.FindAsync([userId], cancellationToken)
            ?? throw new KeyNotFoundException("User not found");
        if (!_passwordHasher.VerifyPassword(password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid password");
        _db.Users.Remove(user);
        await _db.SaveChangesAsync(cancellationToken);
    }
}
