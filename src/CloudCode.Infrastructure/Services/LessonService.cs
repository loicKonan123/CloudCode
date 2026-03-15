using System.Text.RegularExpressions;
using CloudCode.Application.DTOs.Courses;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Services;

public class LessonService : ILessonService
{
    private readonly ApplicationDbContext _db;

    public LessonService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<List<LessonListItemDto>> GetLessonsByCourseSlugAsync(string courseSlug)
    {
        var course = await _db.Courses
            .Include(c => c.Lessons.OrderBy(l => l.OrderIndex))
                .ThenInclude(l => l.Challenge)
            .FirstOrDefaultAsync(c => c.Slug == courseSlug);

        if (course == null) return [];

        return course.Lessons
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
            }).ToList();
    }

    public async Task<LessonDetailDto?> GetLessonAsync(string courseSlug, string lessonSlug)
    {
        var course = await _db.Courses
            .Include(c => c.Lessons.OrderBy(l => l.OrderIndex))
                .ThenInclude(l => l.Challenge)
            .FirstOrDefaultAsync(c => c.Slug == courseSlug);

        if (course == null) return null;

        var lessons = course.Lessons.Where(l => l.IsPublished).ToList();
        var lesson = lessons.FirstOrDefault(l => l.Slug == lessonSlug);
        if (lesson == null) return null;

        var idx = lessons.IndexOf(lesson);

        return new LessonDetailDto
        {
            Id = lesson.Id,
            Title = lesson.Title,
            Slug = lesson.Slug,
            Content = lesson.Content,
            OrderIndex = lesson.OrderIndex,
            IsPublished = lesson.IsPublished,
            ChallengeSlug = lesson.Challenge?.Slug,
            ChallengeTitle = lesson.Challenge?.Title,
            PrevLessonSlug = idx > 0 ? lessons[idx - 1].Slug : null,
            NextLessonSlug = idx < lessons.Count - 1 ? lessons[idx + 1].Slug : null
        };
    }

    public async Task<LessonDetailDto> CreateLessonAsync(Guid courseId, CreateLessonDto dto)
    {
        var course = await _db.Courses.FindAsync(courseId)
            ?? throw new KeyNotFoundException("Course not found");

        var slug = GenerateSlug(dto.Title);
        var existingCount = await _db.Lessons.CountAsync(l => l.CourseId == courseId && l.Slug.StartsWith(slug));
        if (existingCount > 0) slug = $"{slug}-{existingCount + 1}";

        var lesson = new Lesson
        {
            CourseId = courseId,
            Title = dto.Title,
            Slug = slug,
            Content = dto.Content,
            OrderIndex = dto.OrderIndex,
            IsPublished = dto.IsPublished,
            ChallengeId = dto.ChallengeId
        };

        _db.Lessons.Add(lesson);
        await _db.SaveChangesAsync();

        return (await GetLessonAsync(course.Slug, lesson.Slug))!;
    }

    public async Task<LessonDetailDto> UpdateLessonAsync(Guid lessonId, UpdateLessonDto dto)
    {
        var lesson = await _db.Lessons.Include(l => l.Course).FirstOrDefaultAsync(l => l.Id == lessonId)
            ?? throw new KeyNotFoundException("Lesson not found");

        lesson.Title = dto.Title;
        lesson.Content = dto.Content;
        lesson.OrderIndex = dto.OrderIndex;
        lesson.IsPublished = dto.IsPublished;
        lesson.ChallengeId = dto.ChallengeId;
        lesson.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return (await GetLessonAsync(lesson.Course.Slug, lesson.Slug))!;
    }

    public async Task DeleteLessonAsync(Guid lessonId)
    {
        var lesson = await _db.Lessons.FindAsync(lessonId)
            ?? throw new KeyNotFoundException("Lesson not found");
        _db.Lessons.Remove(lesson);
        await _db.SaveChangesAsync();
    }

    private static string GenerateSlug(string title)
    {
        var slug = title.ToLowerInvariant().Trim();
        slug = Regex.Replace(slug, @"\s+", "-");
        slug = Regex.Replace(slug, @"[^a-z0-9\-]", "");
        slug = Regex.Replace(slug, @"-+", "-").Trim('-');
        return slug;
    }
}
