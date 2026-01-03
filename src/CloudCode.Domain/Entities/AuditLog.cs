using CloudCode.Domain.Common;

namespace CloudCode.Domain.Entities;

/// <summary>
/// Journal d'audit pour tracer les actions des utilisateurs.
/// Utilisé pour l'historique d'activité des projets.
/// </summary>
public class AuditLog : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? ProjectId { get; set; }
    public string Action { get; set; } = string.Empty; // Ex: "FILE_CREATED", "PROJECT_SHARED"
    public string? Details { get; set; } // JSON avec détails supplémentaires
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    // Navigation properties
    public virtual User User { get; set; } = null!;
    public virtual Project? Project { get; set; }
}
