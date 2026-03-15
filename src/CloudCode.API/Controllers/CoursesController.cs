using CloudCode.Application.DTOs.Courses;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

[Route("api/courses")]
public class CoursesController : BaseApiController
{
    private readonly ICourseService _courseService;
    private readonly IPremiumService _premiumService;

    public CoursesController(ICourseService courseService, IPremiumService premiumService)
    {
        _courseService = courseService;
        _premiumService = premiumService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<CourseListItemDto>>> GetAll([FromQuery] int? language)
    {
        var userId = GetRequiredUserId();
        if (!await _premiumService.IsPremiumActiveAsync(userId))
            return StatusCode(402, new { message = "Premium required to access courses." });

        var courses = await _courseService.GetPublishedCoursesAsync(language);
        return Ok(courses);
    }

    [HttpGet("{slug}")]
    [Authorize]
    public async Task<ActionResult<CourseDetailDto>> GetBySlug(string slug)
    {
        var userId = GetRequiredUserId();
        if (!await _premiumService.IsPremiumActiveAsync(userId))
            return StatusCode(402, new { message = "Premium required to access courses." });

        var course = await _courseService.GetBySlugAsync(slug, CurrentUserId);
        if (course == null) return NotFound();
        return Ok(course);
    }
}
