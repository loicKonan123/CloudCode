using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Projects;

/// <summary>
/// DTO pour la recherche de projets.
/// </summary>
public class ProjectSearchDto
{
    public string? SearchTerm { get; set; }
    public ProgrammingLanguage? Language { get; set; }
    public bool? IsPublic { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } // "name", "created", "updated"
    public bool SortDescending { get; set; } = true;
}

/// <summary>
/// Réponse paginée pour la recherche.
/// </summary>
public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;
}
