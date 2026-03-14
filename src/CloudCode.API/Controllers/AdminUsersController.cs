using CloudCode.Infrastructure.Data;
using CloudCode.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/admin/users")]
public class AdminUsersController : BaseApiController
{
    private readonly ApplicationDbContext _db;
    private readonly PasswordHasher _passwordHasher;

    public AdminUsersController(ApplicationDbContext db, PasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    [HttpGet]
    public async Task<ActionResult<List<AdminUserDto>>> GetAll()
    {
        var users = await _db.Users
            .OrderByDescending(u => u.IsAdmin)
            .ThenBy(u => u.Username)
            .Select(u => new AdminUserDto
            {
                Id = u.Id,
                Email = u.Email,
                Username = u.Username,
                IsAdmin = u.IsAdmin,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPost("{id:guid}/toggle-admin")]
    public async Task<ActionResult<AdminUserDto>> ToggleAdmin(Guid id)
    {
        var currentUserId = GetCurrentUserId();

        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();

        // Prevent removing own admin rights
        if (user.Id == currentUserId && user.IsAdmin)
            return BadRequest(new { message = "Vous ne pouvez pas retirer vos propres droits admin." });

        user.IsAdmin = !user.IsAdmin;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new AdminUserDto
        {
            Id = user.Id,
            Email = user.Email,
            Username = user.Username,
            IsAdmin = user.IsAdmin,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteUser(Guid id)
    {
        var currentUserId = GetCurrentUserId();

        var user = await _db.Users.FindAsync(id);
        if (user == null)
        {
            Console.WriteLine($"[DeleteUser] User {id} NOT FOUND in DB");
            return NotFound();
        }

        Console.WriteLine($"[DeleteUser] START deleting user: {user.Email} (Id={id})");

        if (user.Id == currentUserId)
            return BadRequest(new { message = "Vous ne pouvez pas supprimer votre propre compte." });

        try
        {
            var comments = await _db.ChallengeComments.Where(c => c.UserId == id).ToListAsync();
            Console.WriteLine($"[DeleteUser] Comments to delete: {comments.Count}");
            _db.RemoveRange(comments);

            var subs = await _db.UserSubmissions.Where(s => s.UserId == id).ToListAsync();
            Console.WriteLine($"[DeleteUser] Submissions to delete: {subs.Count}");
            _db.RemoveRange(subs);

            var progress = await _db.UserProgress.Where(p => p.UserId == id).ToListAsync();
            Console.WriteLine($"[DeleteUser] Progress to delete: {progress.Count}");
            _db.RemoveRange(progress);

            var ranks = await _db.VsRanks.Where(r => r.UserId == id).ToListAsync();
            Console.WriteLine($"[DeleteUser] VsRanks to delete: {ranks.Count}");
            _db.RemoveRange(ranks);

            var logs = await _db.AuditLogs.Where(a => a.UserId == id).ToListAsync();
            Console.WriteLine($"[DeleteUser] AuditLogs to delete: {logs.Count}");
            _db.RemoveRange(logs);

            var collabs = await _db.Collaborations.Where(c => c.UserId == id).ToListAsync();
            Console.WriteLine($"[DeleteUser] Collaborations to delete: {collabs.Count}");
            _db.RemoveRange(collabs);

            var gitCreds = await _db.GitCredentials.Where(g => g.UserId == id).ToListAsync();
            Console.WriteLine($"[DeleteUser] GitCredentials to delete: {gitCreds.Count}");
            _db.RemoveRange(gitCreds);

            // VsMatches: raw SQL car colonne Player1Language manquante en DB
            Console.WriteLine($"[DeleteUser] Deleting VsMatches via raw SQL...");
            await _db.Database.ExecuteSqlInterpolatedAsync(
                $"DELETE FROM VsMatches WHERE Player1Id = {id.ToString()} OR Player2Id = {id.ToString()}");

            var projectIds = await _db.Projects.Where(p => p.OwnerId == id).Select(p => p.Id).ToListAsync();
            Console.WriteLine($"[DeleteUser] Projects to delete: {projectIds.Count}");
            if (projectIds.Count > 0)
            {
                _db.RemoveRange(await _db.ExecutionResults.Where(e => projectIds.Contains(e.ProjectId)).ToListAsync());
                _db.RemoveRange(await _db.ProjectDependencies.Where(d => projectIds.Contains(d.ProjectId)).ToListAsync());
                _db.RemoveRange(await _db.EnvironmentVariables.Where(e => projectIds.Contains(e.ProjectId)).ToListAsync());
                _db.RemoveRange(await _db.CodeFiles.Where(f => projectIds.Contains(f.ProjectId)).ToListAsync());
            }
            _db.RemoveRange(await _db.Projects.Where(p => p.OwnerId == id).ToListAsync());

            var execResults = await _db.ExecutionResults.Where(e => e.UserId == id).ToListAsync();
            Console.WriteLine($"[DeleteUser] ExecutionResults to delete: {execResults.Count}");
            _db.RemoveRange(execResults);

            _db.Users.Remove(user);

            Console.WriteLine($"[DeleteUser] Calling SaveChangesAsync...");
            await _db.SaveChangesAsync();
            Console.WriteLine($"[DeleteUser] SUCCESS — user {user.Email} deleted");
            return Ok(new { message = "Utilisateur supprimé." });
        }
        catch (Exception ex)
        {
            var msg = ex.InnerException?.Message ?? ex.Message;
            Console.WriteLine($"[DeleteUser] FAILED: {msg}");
            return StatusCode(500, new { message = $"Erreur: {msg}" });
        }
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == "userId");
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }
}

public class AdminUserDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
}
