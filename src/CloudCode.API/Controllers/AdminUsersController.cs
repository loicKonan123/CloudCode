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
        if (user == null) return NotFound();

        if (user.Id == currentUserId)
            return BadRequest(new { message = "Vous ne pouvez pas supprimer votre propre compte." });

        // Désactiver les FK SQLite, tout supprimer en raw SQL, réactiver
        var uid = id.ToString();
        await _db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = OFF");
        try
        {
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM UserSubmissions WHERE UserId = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM UserProgress WHERE UserId = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM VsRanks WHERE UserId = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM AuditLogs WHERE UserId = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM Collaborations WHERE UserId = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM GitCredentials WHERE UserId = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM VsMatches WHERE Player1Id = {0} OR Player2Id = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM ExecutionResults WHERE UserId = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM ExecutionResults WHERE ProjectId IN (SELECT Id FROM Projects WHERE OwnerId = {0})", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM ProjectDependencies WHERE ProjectId IN (SELECT Id FROM Projects WHERE OwnerId = {0})", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM EnvironmentVariables WHERE ProjectId IN (SELECT Id FROM Projects WHERE OwnerId = {0})", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM CodeFiles WHERE ProjectId IN (SELECT Id FROM Projects WHERE OwnerId = {0})", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM Projects WHERE OwnerId = {0}", uid);
            await _db.Database.ExecuteSqlRawAsync("DELETE FROM Users WHERE Id = {0}", uid);
        }
        finally
        {
            await _db.Database.ExecuteSqlRawAsync("PRAGMA foreign_keys = ON");
        }

        return Ok(new { message = "Utilisateur supprimé." });
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
