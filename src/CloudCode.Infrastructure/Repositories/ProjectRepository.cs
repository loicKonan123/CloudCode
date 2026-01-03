using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Repositories;

public class ProjectRepository : Repository<Project>, IProjectRepository
{
    public ProjectRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Project>> GetByOwnerIdAsync(Guid ownerId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Owner)
            .Where(p => p.OwnerId == ownerId)
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Project?> GetByIdWithOwnerAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Owner)
            .Include(p => p.Files)
            .Include(p => p.Collaborators)
            .FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);
    }

    public async Task<Project?> GetByIdWithFilesAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Owner)
            .Include(p => p.Files.Where(f => f.ParentId == null))
                .ThenInclude(f => f.Children)
            .FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);
    }

    public async Task<(IEnumerable<Project> Projects, int TotalCount)> SearchAsync(
        string? searchTerm,
        ProgrammingLanguage? language,
        bool? isPublic,
        int page,
        int pageSize,
        string? sortBy,
        bool sortDescending,
        CancellationToken cancellationToken = default)
    {
        var query = _dbSet.Include(p => p.Owner).AsQueryable();

        // Filtre public/privé
        if (isPublic.HasValue)
        {
            query = query.Where(p => p.IsPublic == isPublic.Value);
        }

        // Recherche textuelle
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var term = searchTerm.ToLower();
            query = query.Where(p =>
                p.Name.ToLower().Contains(term) ||
                (p.Description != null && p.Description.ToLower().Contains(term)) ||
                (p.Tags != null && p.Tags.ToLower().Contains(term)));
        }

        // Filtre par langage
        if (language.HasValue)
        {
            query = query.Where(p => p.Language == language.Value);
        }

        // Compter le total
        var totalCount = await query.CountAsync(cancellationToken);

        // Tri
        query = sortBy?.ToLower() switch
        {
            "name" => sortDescending ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
            "updated" => sortDescending ? query.OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt) : query.OrderBy(p => p.UpdatedAt ?? p.CreatedAt),
            _ => sortDescending ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt)
        };

        // Pagination
        var projects = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (projects, totalCount);
    }

    public async Task<Project?> GetWithCollaboratorsAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(p => p.Owner)
            .Include(p => p.Collaborators)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(p => p.Id == projectId, cancellationToken);
    }

    public async Task<IEnumerable<Project>> GetUserAccessibleProjectsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        // Projets dont l'utilisateur est propriétaire OU collaborateur
        return await _dbSet
            .Include(p => p.Owner)
            .Where(p => p.OwnerId == userId ||
                        p.Collaborators.Any(c => c.UserId == userId && c.AcceptedAt != null))
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> UserHasAccessAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .AnyAsync(p => p.Id == projectId &&
                          (p.OwnerId == userId ||
                           p.IsPublic ||
                           p.Collaborators.Any(c => c.UserId == userId && c.AcceptedAt != null)),
                      cancellationToken);
    }
}
