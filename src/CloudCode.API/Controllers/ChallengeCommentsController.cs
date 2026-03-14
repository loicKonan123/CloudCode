using CloudCode.Domain.Entities;
using CloudCode.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Controllers;

[Authorize]
[Route("api/challenges/{slug}/comments")]
public class ChallengeCommentsController : BaseApiController
{
    private readonly ApplicationDbContext _db;

    public ChallengeCommentsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<CommentDto>>> GetComments(string slug)
    {
        Console.WriteLine($"[Comments] GET comments for slug={slug}");
        var challenge = await _db.Challenges.FirstOrDefaultAsync(c => c.Slug == slug && c.IsPublished);
        if (challenge == null)
        {
            Console.WriteLine($"[Comments] Challenge slug={slug} NOT FOUND");
            return NotFound();
        }

        var comments = await _db.ChallengeComments
            .Where(c => c.ChallengeId == challenge.Id && c.ParentId == null)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CommentDto
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                Author = new CommentAuthorDto
                {
                    Id = c.UserId,
                    Username = c.User.Username,
                    Avatar = c.User.Avatar
                },
                Replies = c.Replies
                    .OrderBy(r => r.CreatedAt)
                    .Select(r => new CommentDto
                    {
                        Id = r.Id,
                        Content = r.Content,
                        CreatedAt = r.CreatedAt,
                        ParentId = r.ParentId,
                        Author = new CommentAuthorDto
                        {
                            Id = r.UserId,
                            Username = r.User.Username,
                            Avatar = r.User.Avatar
                        },
                        Replies = new List<CommentDto>()
                    })
                    .ToList()
            })
            .ToListAsync();

        Console.WriteLine($"[Comments] Returning {comments.Count} comments for slug={slug}");
        return Ok(comments);
    }

    [HttpPost]
    public async Task<ActionResult<CommentDto>> PostComment(string slug, [FromBody] CreateCommentDto dto)
    {
        Console.WriteLine($"[Comments] POST comment on slug={slug}, parentId={dto.ParentId}");
        if (string.IsNullOrWhiteSpace(dto.Content) || dto.Content.Length > 2000)
        {
            Console.WriteLine("[Comments] POST REJECTED: content length invalid");
            return BadRequest(new { message = "Content must be between 1 and 2000 characters." });
        }

        var challenge = await _db.Challenges.FirstOrDefaultAsync(c => c.Slug == slug && c.IsPublished);
        if (challenge == null) return NotFound();

        var userId = CurrentUserId;
        if (userId == null) return Unauthorized();

        if (dto.ParentId.HasValue)
        {
            var parent = await _db.ChallengeComments.FindAsync(dto.ParentId.Value);
            if (parent == null || parent.ChallengeId != challenge.Id || parent.ParentId != null)
                return BadRequest(new { message = "Invalid parent comment." });
        }

        var comment = new ChallengeComment
        {
            ChallengeId = challenge.Id,
            UserId = userId.Value,
            Content = dto.Content.Trim(),
            ParentId = dto.ParentId
        };

        _db.ChallengeComments.Add(comment);
        await _db.SaveChangesAsync();
        Console.WriteLine($"[Comments] Comment CREATED: id={comment.Id} by userId={userId}");

        var user = await _db.Users.FindAsync(userId.Value);
        return Ok(new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            ParentId = comment.ParentId,
            Author = new CommentAuthorDto { Id = userId.Value, Username = user!.Username, Avatar = user.Avatar },
            Replies = new List<CommentDto>()
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> DeleteComment(string slug, Guid id)
    {
        Console.WriteLine($"[Comments] DELETE comment id={id} on slug={slug}");
        var userId = CurrentUserId;
        if (userId == null) return Unauthorized();

        var comment = await _db.ChallengeComments
            .Include(c => c.Replies)
            .FirstOrDefaultAsync(c => c.Id == id);
        if (comment == null) return NotFound();

        var user = await _db.Users.FindAsync(userId.Value);
        if (comment.UserId != userId.Value && !(user?.IsAdmin ?? false))
            return Forbid();

        if (comment.Replies.Any())
            _db.ChallengeComments.RemoveRange(comment.Replies);

        _db.ChallengeComments.Remove(comment);
        await _db.SaveChangesAsync();
        Console.WriteLine($"[Comments] Comment {id} DELETED successfully");

        return Ok(new { message = "Comment deleted." });
    }
}

public class CommentDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public Guid? ParentId { get; set; }
    public CommentAuthorDto Author { get; set; } = null!;
    public List<CommentDto> Replies { get; set; } = new();
}

public class CommentAuthorDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? Avatar { get; set; }
}

public class CreateCommentDto
{
    public string Content { get; set; } = string.Empty;
    public Guid? ParentId { get; set; }
}
