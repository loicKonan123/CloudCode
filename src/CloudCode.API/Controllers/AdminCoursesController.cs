using CloudCode.Application.DTOs.Courses;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/admin/courses")]
public class AdminCoursesController : BaseApiController
{
    private readonly ICourseService _courseService;

    public AdminCoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    public async Task<ActionResult<List<CourseListItemDto>>> GetAll()
    {
        var courses = await _courseService.GetAllCoursesAsync();
        return Ok(courses);
    }

    [HttpPost]
    public async Task<ActionResult<CourseDetailDto>> Create([FromBody] CreateCourseDto dto)
    {
        var course = await _courseService.CreateCourseAsync(dto);
        return CreatedAtAction(nameof(Create), new { id = course.Id }, course);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CourseDetailDto>> Update(Guid id, [FromBody] UpdateCourseDto dto)
    {
        try
        {
            var course = await _courseService.UpdateCourseAsync(id, dto);
            return Ok(course);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        try
        {
            await _courseService.DeleteCourseAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<CourseDetailDto>> TogglePublish(Guid id)
    {
        try
        {
            var course = await _courseService.TogglePublishAsync(id);
            return Ok(course);
        }
        catch (KeyNotFoundException) { return NotFound(); }
    }
}
