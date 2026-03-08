using CloudCode.Application.DTOs.Courses;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

[Route("api/courses")]
public class CoursesController : BaseApiController
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    [Authorize]
    public async Task<ActionResult<List<CourseListItemDto>>> GetAll([FromQuery] int? language)
    {
        var courses = await _courseService.GetPublishedCoursesAsync(language);
        return Ok(courses);
    }

    [HttpGet("{slug}")]
    [Authorize]
    public async Task<ActionResult<CourseDetailDto>> GetBySlug(string slug)
    {
        var course = await _courseService.GetBySlugAsync(slug, CurrentUserId);
        if (course == null) return NotFound();
        return Ok(course);
    }
}
