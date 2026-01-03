using AutoMapper;
using CloudCode.Application.DTOs.Auth;
using CloudCode.Application.DTOs.Collaboration;
using CloudCode.Application.DTOs.Execution;
using CloudCode.Application.DTOs.Files;
using CloudCode.Application.DTOs.Projects;
using CloudCode.Application.DTOs.Users;
using CloudCode.Domain.Entities;
using System.Text.Json;

namespace CloudCode.Application.Mappings;

/// <summary>
/// Configuration des mappings AutoMapper entre entités et DTOs.
/// </summary>
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mappings
        CreateMap<User, UserInfoDto>();
        CreateMap<User, UserProfileDto>()
            .ForMember(dest => dest.ProjectCount, opt => opt.MapFrom(src => src.Projects.Count));
        CreateMap<User, PublicUserDto>()
            .ForMember(dest => dest.PublicProjectCount, opt => opt.MapFrom(src => src.Projects.Count(p => p.IsPublic)));
        CreateMap<User, ProjectOwnerDto>();

        // Project mappings
        CreateMap<Project, ProjectResponseDto>()
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => ParseTags(src.Tags)))
            .ForMember(dest => dest.FileCount, opt => opt.MapFrom(src => src.Files.Count))
            .ForMember(dest => dest.CollaboratorCount, opt => opt.MapFrom(src => src.Collaborators.Count));

        CreateMap<Project, ProjectListItemDto>()
            .ForMember(dest => dest.OwnerUsername, opt => opt.MapFrom(src => src.Owner.Username));

        CreateMap<CreateProjectDto, Project>()
            .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => SerializeTags(src.Tags)));

        // File mappings
        CreateMap<CodeFile, FileResponseDto>();
        CreateMap<CodeFile, FileTreeItemDto>();
        CreateMap<CodeFile, FileListItemDto>()
            .ForMember(dest => dest.UpdatedAt, opt => opt.MapFrom(src => src.UpdatedAt ?? src.CreatedAt));
        CreateMap<CreateFileDto, CodeFile>();

        // Collaboration mappings
        CreateMap<Collaboration, CollaboratorResponseDto>()
            .ForMember(dest => dest.Username, opt => opt.MapFrom(src => src.User.Username))
            .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.User.Email))
            .ForMember(dest => dest.Avatar, opt => opt.MapFrom(src => src.User.Avatar));

        // Execution mappings
        CreateMap<ExecutionResult, ExecutionResultDto>()
            .ForMember(dest => dest.ExecutionTimeMs, opt => opt.MapFrom(src => src.ExecutionTime.TotalMilliseconds))
            .ForMember(dest => dest.ExecutedAt, opt => opt.MapFrom(src => src.CreatedAt));

        CreateMap<ExecutionResult, ExecutionHistoryItemDto>()
            .ForMember(dest => dest.FileName, opt => opt.MapFrom(src => src.File.Name))
            .ForMember(dest => dest.ExecutionTimeMs, opt => opt.MapFrom(src => src.ExecutionTime.TotalMilliseconds))
            .ForMember(dest => dest.ExecutedAt, opt => opt.MapFrom(src => src.CreatedAt));
    }

    private static List<string> ParseTags(string? tagsJson)
    {
        if (string.IsNullOrEmpty(tagsJson))
            return new List<string>();

        try
        {
            return JsonSerializer.Deserialize<List<string>>(tagsJson) ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private static string? SerializeTags(List<string>? tags)
    {
        if (tags == null || tags.Count == 0)
            return null;

        return JsonSerializer.Serialize(tags);
    }
}
