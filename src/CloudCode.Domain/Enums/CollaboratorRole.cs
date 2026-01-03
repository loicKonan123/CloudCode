namespace CloudCode.Domain.Enums;

/// <summary>
/// Rôles des collaborateurs sur un projet.
/// </summary>
public enum CollaboratorRole
{
    /// <summary>
    /// Lecture seule - peut voir le code mais pas modifier.
    /// </summary>
    Read = 1,

    /// <summary>
    /// Lecture et écriture - peut modifier le code.
    /// </summary>
    Write = 2,

    /// <summary>
    /// Administration - peut gérer les collaborateurs et paramètres.
    /// </summary>
    Admin = 3
}
