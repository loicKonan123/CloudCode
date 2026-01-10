using CloudCode.Domain.Entities;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Repositories;

public class ProjectDependencyRepository : Repository<ProjectDependency>, IProjectDependencyRepository
{
    public ProjectDependencyRepository(ApplicationDbContext context) : base(context)
    {
    }

    public async Task<IEnumerable<ProjectDependency>> GetByProjectIdAsync(Guid projectId, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .Where(d => d.ProjectId == projectId)
            .OrderBy(d => d.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectDependency?> GetByProjectAndNameAsync(Guid projectId, string name, CancellationToken cancellationToken = default)
    {
        return await _dbSet
            .FirstOrDefaultAsync(d => d.ProjectId == projectId && d.Name == name, cancellationToken);
    }
}
