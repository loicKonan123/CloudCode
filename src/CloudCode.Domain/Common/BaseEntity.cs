namespace CloudCode.Domain.Common;

/// <summary>
/// Classe de base pour toutes les entités du domaine.
/// Fournit les propriétés communes: Id, timestamps.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    protected BaseEntity()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
    }
}
