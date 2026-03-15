using CloudCode.Application.DTOs.Courses;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

[Route("api/courses/{courseSlug}/lessons")]
public class LessonsController : BaseApiController
{
    private readonly ILessonService _lessonService;
    private readonly IPremiumService _premiumService;

    public LessonsController(ILessonService lessonService, IPremiumService premiumService)
    {
        _lessonService = lessonService;
        _premiumService = premiumService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<LessonListItemDto>>> GetAll(string courseSlug)
    {
        var userId = GetRequiredUserId();
        if (!await _premiumService.IsPremiumActiveAsync(userId))
            return StatusCode(402, new { message = "Premium required to access lessons." });

        var lessons = await _lessonService.GetLessonsByCourseSlugAsync(courseSlug);
        return Ok(lessons);
    }

    [HttpGet("{lessonSlug}")]
    [Authorize]
    public async Task<ActionResult<LessonDetailDto>> GetBySlug(string courseSlug, string lessonSlug)
    {
        var userId = GetRequiredUserId();
        if (!await _premiumService.IsPremiumActiveAsync(userId))
            return StatusCode(402, new { message = "Premium required to access lessons." });

        var lesson = await _lessonService.GetLessonAsync(courseSlug, lessonSlug);
        if (lesson == null) return NotFound();
        return Ok(lesson);
    }
}

[Authorize(Policy = "AdminOnly")]
[Route("api/admin/courses/{courseId:guid}/lessons")]
public class AdminLessonsController : BaseApiController
{
    private readonly ILessonService _lessonService;

    public AdminLessonsController(ILessonService lessonService)
    {
        _lessonService = lessonService;
    }

    [HttpPost]
    public async Task<ActionResult<LessonDetailDto>> Create(Guid courseId, [FromBody] CreateLessonDto dto)
    {
        try
        {
            var lesson = await _lessonService.CreateLessonAsync(courseId, dto);
            return CreatedAtAction(nameof(Create), new { courseId, id = lesson.Id }, lesson);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPut("{lessonId:guid}")]
    public async Task<ActionResult<LessonDetailDto>> Update(Guid courseId, Guid lessonId, [FromBody] UpdateLessonDto dto)
    {
        try
        {
            var lesson = await _lessonService.UpdateLessonAsync(lessonId, dto);
            return Ok(lesson);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{lessonId:guid}")]
    public async Task<ActionResult> Delete(Guid courseId, Guid lessonId)
    {
        try
        {
            await _lessonService.DeleteLessonAsync(lessonId);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
