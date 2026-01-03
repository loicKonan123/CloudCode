using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Repositories;

public class CollaborationRepository : Repository<Collaboration>, ICollaborationRepository
{
    public CollaborationRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<Collaboration>> GetByProjectIdAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.User)
            .Where(c => c.ProjectId == projectId)
            .OrderBy(c => c.InvitedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<Collaboration>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Project)
                .ThenInclude(p => p.Owner)
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.InvitedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<Collaboration?> GetByProjectAndUserAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.ProjectId == projectId && c.UserId == userId, cancellationToken);
    }

    public async Task<CollaboratorRole?> GetUserRoleAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        var collaboration = await _dbSet
            .FirstOrDefaultAsync(c => c.ProjectId == projectId &&
                                      c.UserId == userId &&
                                      c.AcceptedAt != null,
                                 cancellationToken);

        return collaboration?.Role;
    }

    public async Task<IEnumerable<Collaboration>> GetPendingInvitationsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Include(c => c.Project)
                .ThenInclude(p => p.Owner)
            .Where(c => c.UserId == userId && c.AcceptedAt == null)
            .OrderByDescending(c => c.InvitedAt)
            .ToListAsync(cancellationToken);
    }
}
