using CloudCode.Application.DTOs.Collaboration;
using CloudCode.Domain.Enums;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service de gestion des collaborations sur les projets.
/// </summary>
public interface ICollaborationService
{
    Task<CollaboratorResponseDto> InviteAsync(Guid projectId, Guid inviterId, InviteCollaboratorDto dto, CancellationToken cancellationToken = default);
    Task<IEnumerable<CollaboratorResponseDto>> GetCollaboratorsAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
    Task<CollaboratorResponseDto> UpdateRoleAsync(Guid projectId, Guid collaboratorUserId, Guid currentUserId, UpdateCollaboratorRoleDto dto, CancellationToken cancellationToken = default);
    Task RemoveCollaboratorAsync(Guid projectId, Guid collaboratorUserId, Guid currentUserId, CancellationToken cancellationToken = default);
    Task<IEnumerable<PendingInvitationDto>> GetPendingInvitationsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AcceptInvitationAsync(Guid collaborationId, Guid userId, CancellationToken cancellationToken = default);
    Task DeclineInvitationAsync(Guid collaborationId, Guid userId, CancellationToken cancellationToken = default);
    Task<CollaboratorRole?> GetUserRoleAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default);
}
