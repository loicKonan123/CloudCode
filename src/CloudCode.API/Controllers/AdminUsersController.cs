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
