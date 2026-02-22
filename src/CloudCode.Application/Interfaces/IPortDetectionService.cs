namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service pour détecter les ports d'applications utilisateur.
/// </summary>
public interface IPortDetectionService
{
    /// <summary>
    /// Détecte le port sur lequel l'application d'un projet écoute.
    /// </summary>
    int? DetectAppPort(Guid projectId, Guid userId);

    /// <summary>
    /// Enregistre manuellement un port pour un projet (appelé par le terminal).
    /// </summary>
    void RegisterPort(Guid projectId, Guid userId, int port);

    /// <summary>
    /// Supprime l'enregistrement du port d'un projet.
    /// </summary>
    void UnregisterPort(Guid projectId, Guid userId);

    /// <summary>
    /// Vérifie si un port est actuellement en écoute.
    /// </summary>
    bool IsPortListening(int port);

    /// <summary>
    /// Récupère le port enregistré pour un projet (sans scan).
    /// </summary>
    int? GetRegisteredPort(Guid projectId, Guid userId);
}
