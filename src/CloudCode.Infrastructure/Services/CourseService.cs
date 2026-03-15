using System.Text.Json;
using System.Text.RegularExpressions;
using CloudCode.Application.DTOs.Courses;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Services;

public class CourseService : ICourseService
{
    private readonly ApplicationDbContext _db;

    public CourseService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<CourseListItemDto>> GetPublishedCoursesAsync(int? language = null)
    {
        var query = _db.Courses.Where(c => c.IsPublished).AsQueryable();
        if (language.HasValue)
            query = query.Where(c => c.Language == language.Value);

        var courses = await query
            .OrderBy(c => c.OrderIndex)
            .ThenBy(c => c.Title)
            .Include(c => c.CourseChallenges)
            .Include(c => c.Lessons)
            .ToListAsync();

        return courses.Select(c => new CourseListItemDto
        {
            Id = c.Id,
            Title = c.Title,
            Slug = c.Slug,
            Description = c.Description,
            Language = c.Language,
            ChallengeCount = c.CourseChallenges.Count,
            LessonCount = c.Lessons.Count(l => l.IsPublished),
            IsPublished = c.IsPublished,
            OrderIndex = c.OrderIndex
        }).ToList();
    }

    public async Task<CourseDetailDto?> GetBySlugAsync(string slug, Guid? userId = null)
    {
        var course = await _db.Courses
            .Include(c => c.CourseChallenges)
                .ThenInclude(cc => cc.Challenge)
            .Include(c => c.Lessons.OrderBy(l => l.OrderIndex))
                .ThenInclude(l => l.Challenge)
            .FirstOrDefaultAsync(c => c.Slug == slug);

        if (course == null) return null;

        // Get user solved challenges
        var solvedIds = new HashSet<Guid>();
        if (userId.HasValue)
        {
            var solved = await _db.UserProgress
                .Where(p => p.UserId == userId.Value && p.IsSolved)
                .Select(p => p.ChallengeId)
                .ToListAsync();
            solvedIds = solved.ToHashSet();
        }

        var challenges = course.CourseChallenges
            .OrderBy(cc => cc.OrderIndex)
            .Select(cc => new CourseChallengeDto
            {
                Id = cc.Challenge.Id,
                Title = cc.Challenge.Title,
                Slug = cc.Challenge.Slug,
                Difficulty = (int)cc.Challenge.Difficulty,
                Tags = DeserializeTags(cc.Challenge.Tags),
                OrderIndex = cc.OrderIndex,
                IsSolved = solvedIds.Contains(cc.Challenge.Id)
            }).ToList();

        return new CourseDetailDto
        {
            Id = course.Id,
            Title = course.Title,
            Slug = course.Slug,
            Description = course.Description,
            Language = course.Language,
            IsPublished = course.IsPublished,
            OrderIndex = course.OrderIndex,
            Challenges = challenges,
            Lessons = course.Lessons
                .Where(l => l.IsPublished)
                .Select(l => new LessonListItemDto
                {
                    Id = l.Id,
                    Title = l.Title,
                    Slug = l.Slug,
                    OrderIndex = l.OrderIndex,
                    IsPublished = l.IsPublished,
                    HasChallenge = l.ChallengeId.HasValue,
                    ChallengeSlug = l.Challenge?.Slug
                }).ToList(),
            LessonCount = course.Lessons.Count(l => l.IsPublished)
        };
    }

    public async Task<List<CourseListItemDto>> GetAllCoursesAsync()
    {
        var courses = await _db.Courses
            .OrderBy(c => c.Language)
            .ThenBy(c => c.OrderIndex)
            .Include(c => c.CourseChallenges)
            .Include(c => c.Lessons)
            .ToListAsync();

        return courses.Select(c => new CourseListItemDto
        {
            Id = c.Id,
            Title = c.Title,
            Slug = c.Slug,
            Description = c.Description,
            Language = c.Language,
            ChallengeCount = c.CourseChallenges.Count,
            LessonCount = c.Lessons.Count(l => l.IsPublished),
            IsPublished = c.IsPublished,
            OrderIndex = c.OrderIndex
        }).ToList();
    }

    public async Task<CourseDetailDto> CreateCourseAsync(CreateCourseDto dto)
    {
        var slug = GenerateSlug(dto.Title);
        // Ensure slug uniqueness
        var existingCount = await _db.Courses.CountAsync(c => c.Slug.StartsWith(slug));
        if (existingCount > 0) slug = $"{slug}-{existingCount + 1}";

        var course = new Course
        {
            Title = dto.Title,
            Slug = slug,
            Description = dto.Description,
            Language = dto.Language,
            OrderIndex = dto.OrderIndex,
            IsPublished = dto.IsPublished
        };

        _db.Courses.Add(course);
        await _db.SaveChangesAsync();

        // Add challenges
        for (int i = 0; i < dto.ChallengeIds.Count; i++)
        {
            _db.CourseChallenges.Add(new CourseChallenge
            {
                Id = Guid.NewGuid(),
                CourseId = course.Id,
                ChallengeId = dto.ChallengeIds[i],
                OrderIndex = i
            });
        }
        await _db.SaveChangesAsync();

        return (await GetBySlugAsync(course.Slug))!;
    }

    public async Task<CourseDetailDto> UpdateCourseAsync(Guid id, UpdateCourseDto dto)
    {
        var course = await _db.Courses
            .Include(c => c.CourseChallenges)
            .FirstOrDefaultAsync(c => c.Id == id)
            ?? throw new KeyNotFoundException();

        course.Title = dto.Title;
        course.Description = dto.Description;
        course.Language = dto.Language;
        course.OrderIndex = dto.OrderIndex;
        course.IsPublished = dto.IsPublished;
        course.UpdatedAt = DateTime.UtcNow;

        // Replace challenges
        _db.CourseChallenges.RemoveRange(course.CourseChallenges);
        for (int i = 0; i < dto.ChallengeIds.Count; i++)
        {
            _db.CourseChallenges.Add(new CourseChallenge
            {
                Id = Guid.NewGuid(),
                CourseId = course.Id,
                ChallengeId = dto.ChallengeIds[i],
                OrderIndex = i
            });
        }
        await _db.SaveChangesAsync();

        return (await GetBySlugAsync(course.Slug))!;
    }

    public async Task DeleteCourseAsync(Guid id)
    {
        var course = await _db.Courses.FindAsync(id) ?? throw new KeyNotFoundException();
        _db.Courses.Remove(course);
        await _db.SaveChangesAsync();
    }

    public async Task<CourseDetailDto> TogglePublishAsync(Guid id)
    {
        var course = await _db.Courses.FindAsync(id) ?? throw new KeyNotFoundException();
        course.IsPublished = !course.IsPublished;
        course.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return (await GetBySlugAsync(course.Slug))!;
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant().Trim();
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');
        return slug;
    }

    private static List<string> DeserializeTags(string json)
    {
        try { return JsonSerializer.Deserialize<List<string>>(json) ?? []; }
        catch { return []; }
    }
}
