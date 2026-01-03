using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Interfaces;

/// <summary>
/// Repository spécifique pour les opérations sur les collaborations.
/// </summary>
public interface ICollaborationRepository : IRepository<Collaboration>
{
    Task<IEnumerable<Collaboration>> GetByProjectIdAsync(Guid projectId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Collaboration>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Collaboration?> GetByProjectAndUserAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<CollaboratorRole?> GetUserRoleAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<Collaboration>> GetPendingInvitationsAsync(Guid userId, CancellationToken cancellationToken = default);
}
