using CloudCode.Domain.Common;
using CloudCode.Domain.Enums;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Représente une collaboration entre un utilisateur et un projet.
/// Gère les permissions d'accès (Read, Write, Admin).
/// </summary>
public class Collaboration : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public CollaboratorRole Role { get; set; }
    public DateTime InvitedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public string? InvitedByEmail { get; set; } // Email de l'inviteur

    // Navigation properties
    public virtual Project Project { get; set; } = null!;
    public virtual User User { get; set; } = null!;

    public Collaboration()
    {
        InvitedAt = DateTime.UtcNow;
    }
}
