using CloudCode.Application.DTOs.Courses;

namespace CloudCode.Application.Interfaces;

public interface ILessonService
{
    Task<List<LessonListItemDto>> GetLessonsByCourseSlugAsync(string courseSlug);
    Task<LessonDetailDto?> GetLessonAsync(string courseSlug, string lessonSlug);
    Task<LessonDetailDto> CreateLessonAsync(Guid courseId, CreateLessonDto dto);
    Task<LessonDetailDto> UpdateLessonAsync(Guid lessonId, UpdateLessonDto dto);
    Task DeleteLessonAsync(Guid lessonId);
}
