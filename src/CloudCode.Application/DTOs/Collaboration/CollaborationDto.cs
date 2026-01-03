using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Collaboration;

/// <summary>
/// DTO pour inviter un collaborateur.
/// </summary>
public class InviteCollaboratorDto
{
    public string Email { get; set; } = string.Empty;
    public CollaboratorRole Role { get; set; } = CollaboratorRole.Read;
}

/// <summary>
/// DTO pour mettre à jour le rôle d'un collaborateur.
/// </summary>
public class UpdateCollaboratorRoleDto
{
    public CollaboratorRole Role { get; set; }
}

/// <summary>
/// DTO de réponse pour un collaborateur.
/// </summary>
public class CollaboratorResponseDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public CollaboratorRole Role { get; set; }
    public DateTime InvitedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public bool IsPending => AcceptedAt == null;
}

/// <summary>
/// DTO pour une invitation en attente.
/// </summary>
public class PendingInvitationDto
{
    public Guid CollaborationId { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string InviterUsername { get; set; } = string.Empty;
    public CollaboratorRole Role { get; set; }
    public DateTime InvitedAt { get; set; }
}
