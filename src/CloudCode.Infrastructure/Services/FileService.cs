using System.IO.Compression;
using CloudCode.Application.DTOs.Files;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service de gestion des fichiers et dossiers.
/// </summary>
public class FileService : IFileService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IProjectService _projectService;
    private readonly IConfiguration _configuration;

    public FileService(IUnitOfWork unitOfWork, IProjectService projectService, IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _projectService = projectService;
        _configuration = configuration;
    }

    public async Task<FileResponseDto> CreateAsync(Guid projectId, Guid userId, CreateFileDto dto, CancellationToken cancellationToken = default)
    {
        // Vérifier l'accès au projet
        if (!await _projectService.UserHasAccessAsync(projectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
        }

        // Calculer le chemin
        string path;
        if (dto.ParentId.HasValue)
        {
            var parent = await _unitOfWork.Files.GetByIdAsync(dto.ParentId.Value, cancellationToken)
                ?? throw new NotFoundException("PARENT_NOT_FOUND", "Dossier parent non trouvé.");

            if (!parent.IsFolder)
            {
                throw new ValidationException("INVALID_PARENT", "Le parent doit être un dossier.");
            }

            path = $"{parent.Path}/{dto.Name}";
        }
        else
        {
            path = dto.Name;
        }

        // Vérifier si le fichier existe déjà
        var existing = await _unitOfWork.Files.GetByPathAsync(projectId, path, cancellationToken);
        if (existing != null)
        {
            throw new ConflictException("FILE_EXISTS", "Un fichier avec ce nom existe déjà à cet emplacement.");
        }

        var file = new CodeFile
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Path = path,
            Content = dto.IsFolder ? "" : (dto.Content ?? ""),
            IsFolder = dto.IsFolder,
            ParentId = dto.ParentId,
            ProjectId = projectId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Files.AddAsync(file, cancellationToken);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(file);
    }

    public async Task<FileResponseDto> GetByIdAsync(Guid fileId, Guid userId, CancellationToken cancellationToken = default)
    {
        var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken)
            ?? throw new NotFoundException("FILE_NOT_FOUND", "Fichier non trouvé.");

        if (!await _projectService.UserHasAccessAsync(file.ProjectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce fichier.");
        }

        return MapToResponseDto(file);
    }

    public async Task<FileResponseDto> GetByPathAsync(Guid projectId, string path, Guid userId, CancellationToken cancellationToken = default)
    {
        if (!await _projectService.UserHasAccessAsync(projectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
        }

        var file = await _unitOfWork.Files.GetByPathAsync(projectId, path, cancellationToken)
            ?? throw new NotFoundException("FILE_NOT_FOUND", "Fichier non trouvé.");

        return MapToResponseDto(file);
    }

    public async Task<IEnumerable<FileTreeItemDto>> GetFileTreeAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (!await _projectService.UserHasAccessAsync(projectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
        }

        var files = await _unitOfWork.Files.GetByProjectIdAsync(projectId, cancellationToken);

        // Construire l'arborescence
        var fileDict = files.ToDictionary(f => f.Id);
        var rootItems = new List<FileTreeItemDto>();

        foreach (var file in files.Where(f => f.ParentId == null).OrderBy(f => !f.IsFolder).ThenBy(f => f.Name))
        {
            rootItems.Add(BuildFileTreeItem(file, fileDict));
        }

        return rootItems;
    }

    public async Task<FileResponseDto> UpdateContentAsync(Guid fileId, Guid userId, UpdateFileContentDto dto, CancellationToken cancellationToken = default)
    {
        var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken)
            ?? throw new NotFoundException("FILE_NOT_FOUND", "Fichier non trouvé.");

        if (!await _projectService.UserHasAccessAsync(file.ProjectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce fichier.");
        }

        if (file.IsFolder)
        {
            throw new ValidationException("CANNOT_EDIT_FOLDER", "Impossible de modifier le contenu d'un dossier.");
        }

        file.Content = dto.Content;
        file.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Files.Update(file);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(file);
    }

    public async Task<FileResponseDto> RenameAsync(Guid fileId, Guid userId, RenameFileDto dto, CancellationToken cancellationToken = default)
    {
        var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken)
            ?? throw new NotFoundException("FILE_NOT_FOUND", "Fichier non trouvé.");

        if (!await _projectService.UserHasAccessAsync(file.ProjectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce fichier.");
        }

        // Calculer le nouveau chemin
        var newPath = file.ParentId.HasValue
            ? $"{file.Path[..file.Path.LastIndexOf('/')]}/{dto.NewName}"
            : dto.NewName;

        // Vérifier si le nouveau nom existe déjà
        var existing = await _unitOfWork.Files.GetByPathAsync(file.ProjectId, newPath, cancellationToken);
        if (existing != null && existing.Id != fileId)
        {
            throw new ConflictException("FILE_EXISTS", "Un fichier avec ce nom existe déjà.");
        }

        var oldPath = file.Path;
        file.Name = dto.NewName;
        file.Path = newPath;
        file.UpdatedAt = DateTime.UtcNow;

        // Mettre à jour les chemins des enfants si c'est un dossier
        if (file.IsFolder)
        {
            await UpdateChildrenPaths(file.ProjectId, oldPath, newPath, cancellationToken);
        }

        _unitOfWork.Files.Update(file);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(file);
    }

    public async Task<FileResponseDto> MoveAsync(Guid fileId, Guid userId, MoveFileDto dto, CancellationToken cancellationToken = default)
    {
        var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken)
            ?? throw new NotFoundException("FILE_NOT_FOUND", "Fichier non trouvé.");

        if (!await _projectService.UserHasAccessAsync(file.ProjectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce fichier.");
        }

        // Calculer le nouveau chemin
        string newPath;
        if (dto.NewParentId.HasValue)
        {
            var newParent = await _unitOfWork.Files.GetByIdAsync(dto.NewParentId.Value, cancellationToken)
                ?? throw new NotFoundException("PARENT_NOT_FOUND", "Dossier destination non trouvé.");

            if (!newParent.IsFolder)
            {
                throw new ValidationException("INVALID_PARENT", "La destination doit être un dossier.");
            }

            newPath = $"{newParent.Path}/{file.Name}";
        }
        else
        {
            newPath = file.Name;
        }

        var oldPath = file.Path;
        file.ParentId = dto.NewParentId;
        file.Path = newPath;
        file.UpdatedAt = DateTime.UtcNow;

        // Mettre à jour les chemins des enfants si c'est un dossier
        if (file.IsFolder)
        {
            await UpdateChildrenPaths(file.ProjectId, oldPath, newPath, cancellationToken);
        }

        _unitOfWork.Files.Update(file);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(file);
    }

    public async Task<FileResponseDto> CopyAsync(Guid fileId, Guid userId, Guid? targetParentId = null, CancellationToken cancellationToken = default)
    {
        var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken)
            ?? throw new NotFoundException("FILE_NOT_FOUND", "Fichier non trouvé.");

        if (!await _projectService.UserHasAccessAsync(file.ProjectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce fichier.");
        }

        // Calculer le nouveau chemin avec suffixe (copie)
        var baseName = file.IsFolder ? file.Name : Path.GetFileNameWithoutExtension(file.Name);
        var extension = file.IsFolder ? "" : Path.GetExtension(file.Name);
        var copyName = $"{baseName} (copie){extension}";

        string newPath;
        if (targetParentId.HasValue)
        {
            var parent = await _unitOfWork.Files.GetByIdAsync(targetParentId.Value, cancellationToken)
                ?? throw new NotFoundException("PARENT_NOT_FOUND", "Dossier destination non trouvé.");
            newPath = $"{parent.Path}/{copyName}";
        }
        else
        {
            newPath = copyName;
        }

        var copy = new CodeFile
        {
            Id = Guid.NewGuid(),
            Name = copyName,
            Path = newPath,
            Content = file.Content,
            IsFolder = file.IsFolder,
            ParentId = targetParentId ?? file.ParentId,
            ProjectId = file.ProjectId,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Files.AddAsync(copy, cancellationToken);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(copy);
    }

    public async Task DeleteAsync(Guid fileId, Guid userId, CancellationToken cancellationToken = default)
    {
        var file = await _unitOfWork.Files.GetByIdAsync(fileId, cancellationToken)
            ?? throw new NotFoundException("FILE_NOT_FOUND", "Fichier non trouvé.");

        if (!await _projectService.UserHasAccessAsync(file.ProjectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce fichier.");
        }

        // Supprimer récursivement si c'est un dossier
        if (file.IsFolder)
        {
            await DeleteFolderRecursively(file, cancellationToken);
        }

        _unitOfWork.Files.Remove(file);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<byte[]> DownloadProjectAsZipAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (!await _projectService.UserHasAccessAsync(projectId, userId, cancellationToken))
        {
            throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
        }

        var files = await _unitOfWork.Files.GetByProjectIdAsync(projectId, cancellationToken);

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            // Add source files from database
            foreach (var file in files.Where(f => !f.IsFolder))
            {
                var entry = archive.CreateEntry(file.Path);
                using var entryStream = entry.Open();
                using var writer = new StreamWriter(entryStream);
                await writer.WriteAsync(file.Content);
            }

            // Add venv/node_modules from file system if they exist
            var workDir = GetProjectWorkingDirectory(projectId);
            if (Directory.Exists(workDir))
            {
                // Add venv folder for Python projects
                var venvPath = Path.Combine(workDir, "venv");
                if (Directory.Exists(venvPath))
                {
                    AddDirectoryToZip(archive, venvPath, "venv");
                }

                // Add node_modules folder for Node.js projects
                var nodeModulesPath = Path.Combine(workDir, "node_modules");
                if (Directory.Exists(nodeModulesPath))
                {
                    AddDirectoryToZip(archive, nodeModulesPath, "node_modules");
                }

                // Add package.json if exists
                var packageJsonPath = Path.Combine(workDir, "package.json");
                if (File.Exists(packageJsonPath))
                {
                    var entry = archive.CreateEntry("package.json");
                    using var entryStream = entry.Open();
                    using var fileStream = File.OpenRead(packageJsonPath);
                    await fileStream.CopyToAsync(entryStream, cancellationToken);
                }

                // Add package-lock.json if exists
                var packageLockPath = Path.Combine(workDir, "package-lock.json");
                if (File.Exists(packageLockPath))
                {
                    var entry = archive.CreateEntry("package-lock.json");
                    using var entryStream = entry.Open();
                    using var fileStream = File.OpenRead(packageLockPath);
                    await fileStream.CopyToAsync(entryStream, cancellationToken);
                }

                // Add requirements.txt if exists
                var requirementsPath = Path.Combine(workDir, "requirements.txt");
                if (File.Exists(requirementsPath))
                {
                    var entry = archive.CreateEntry("requirements.txt");
                    using var entryStream = entry.Open();
                    using var fileStream = File.OpenRead(requirementsPath);
                    await fileStream.CopyToAsync(entryStream, cancellationToken);
                }
            }
        }

        return memoryStream.ToArray();
    }

    private void AddDirectoryToZip(ZipArchive archive, string sourceDir, string entryPrefix)
    {
        foreach (var filePath in Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(sourceDir, filePath);
            var entryName = Path.Combine(entryPrefix, relativePath).Replace('\\', '/');

            try
            {
                var entry = archive.CreateEntry(entryName);
                using var entryStream = entry.Open();
                using var fileStream = File.OpenRead(filePath);
                fileStream.CopyTo(entryStream);
            }
            catch
            {
                // Skip files that can't be read (locked, permissions, etc.)
            }
        }
    }

    private string GetProjectWorkingDirectory(Guid projectId)
    {
        var configuredDir = _configuration.GetValue<string>("Terminal:WorkingDirectory");
        var baseDir = !string.IsNullOrEmpty(configuredDir)
            ? configuredDir
            : Path.Combine(Path.GetTempPath(), "cloudcode_projects");
        return Path.Combine(baseDir, projectId.ToString());
    }

    private async Task UpdateChildrenPaths(Guid projectId, string oldPath, string newPath, CancellationToken cancellationToken)
    {
        var allFiles = await _unitOfWork.Files.GetByProjectIdAsync(projectId, cancellationToken);
        var children = allFiles.Where(f => f.Path.StartsWith(oldPath + "/"));

        foreach (var child in children)
        {
            child.Path = newPath + child.Path[oldPath.Length..];
            _unitOfWork.Files.Update(child);
        }
    }

    private async Task DeleteFolderRecursively(CodeFile folder, CancellationToken cancellationToken)
    {
        var children = await _unitOfWork.Files.GetChildrenAsync(folder.Id, cancellationToken);

        foreach (var child in children)
        {
            if (child.IsFolder)
            {
                await DeleteFolderRecursively(child, cancellationToken);
            }
            _unitOfWork.Files.Remove(child);
        }
    }

    private FileTreeItemDto BuildFileTreeItem(CodeFile file, Dictionary<Guid, CodeFile> fileDict)
    {
        var item = new FileTreeItemDto
        {
            Id = file.Id,
            Name = file.Name,
            Path = file.Path,
            IsFolder = file.IsFolder,
            ParentId = file.ParentId,
            Children = new List<FileTreeItemDto>()
        };

        if (file.IsFolder)
        {
            var children = fileDict.Values
                .Where(f => f.ParentId == file.Id)
                .OrderBy(f => !f.IsFolder)
                .ThenBy(f => f.Name);

            foreach (var child in children)
            {
                item.Children.Add(BuildFileTreeItem(child, fileDict));
            }
        }

        return item;
    }

    private FileResponseDto MapToResponseDto(CodeFile file)
    {
        return new FileResponseDto
        {
            Id = file.Id,
            Name = file.Name,
            Path = file.Path,
            Content = file.Content,
            IsFolder = file.IsFolder,
            ParentId = file.ParentId,
            ProjectId = file.ProjectId,
            CreatedAt = file.CreatedAt,
            UpdatedAt = file.UpdatedAt
        };
    }
}
