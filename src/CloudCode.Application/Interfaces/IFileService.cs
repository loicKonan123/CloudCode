using CloudCode.Application.DTOs.Files;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service de gestion des fichiers et dossiers.
/// </summary>
public interface IFileService
{
    Task<FileResponseDto> CreateAsync(Guid projectId, Guid userId, CreateFileDto dto, CancellationToken cancellationToken = default);
    Task<FileResponseDto> GetByIdAsync(Guid fileId, Guid userId, CancellationToken cancellationToken = default);
    Task<FileResponseDto> GetByPathAsync(Guid projectId, string path, Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<FileTreeItemDto>> GetFileTreeAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<FileResponseDto> UpdateContentAsync(Guid fileId, Guid userId, UpdateFileContentDto dto, CancellationToken cancellationToken = default);
    Task<FileResponseDto> RenameAsync(Guid fileId, Guid userId, RenameFileDto dto, CancellationToken cancellationToken = default);
    Task<FileResponseDto> MoveAsync(Guid fileId, Guid userId, MoveFileDto dto, CancellationToken cancellationToken = default);
    Task<FileResponseDto> CopyAsync(Guid fileId, Guid userId, Guid? targetParentId = null, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid fileId, Guid userId, CancellationToken cancellationToken = default);
    Task<byte[]> DownloadProjectAsZipAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
}
