using CloudCode.Application.DTOs.Courses;

namespace CloudCode.Application.Interfaces;

public interface ICourseService
{
    Task<List<CourseListItemDto>> GetPublishedCoursesAsync(int? language = null);
    Task<CourseDetailDto?> GetBySlugAsync(string slug, Guid? userId = null);
    Task<List<CourseListItemDto>> GetAllCoursesAsync();
    Task<CourseDetailDto> CreateCourseAsync(CreateCourseDto dto);
    Task<CourseDetailDto> UpdateCourseAsync(Guid id, UpdateCourseDto dto);
    Task DeleteCourseAsync(Guid id);
    Task<CourseDetailDto> TogglePublishAsync(Guid id);
}
