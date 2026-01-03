using CloudCode.Domain.Entities;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Repositories;

public class CodeFileRepository : Repository<CodeFile>, ICodeFileRepository
{
    public CodeFileRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<CodeFile>> GetByProjectIdAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(f => f.ProjectId == projectId)
            .OrderBy(f => f.IsFolder ? 0 : 1) // Dossiers d'abord
            .ThenBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<CodeFile?> GetByPathAsync(Guid projectId, string path, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(f => f.ProjectId == projectId && f.Path == path, cancellationToken);
    }

    public async Task<IEnumerable<CodeFile>> GetRootFilesAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(f => f.ProjectId == projectId && f.ParentId == null)
            .OrderBy(f => f.IsFolder ? 0 : 1)
            .ThenBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<CodeFile>> GetChildrenAsync(Guid parentId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(f => f.ParentId == parentId)
            .OrderBy(f => f.IsFolder ? 0 : 1)
            .ThenBy(f => f.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<CodeFile>> GetFileTreeAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        // Récupère tous les fichiers du projet pour construire l'arbre côté client
        return await _dbSet
            .Where(f => f.ProjectId == projectId)
            .OrderBy(f => f.Path)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> PathExistsAsync(Guid projectId, string path, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(f => f.ProjectId == projectId && f.Path == path, cancellationToken);
    }
}
