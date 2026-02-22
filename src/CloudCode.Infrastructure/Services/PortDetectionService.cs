using System.Collections.Concurrent;
using System.Net;
using System.Net.Sockets;
using CloudCode.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service pour détecter et gérer les ports d'applications utilisateur.
/// </summary>
public class PortDetectionService : IPortDetectionService
{
    private readonly ILogger<PortDetectionService> _logger;
    private readonly int _portRangeStart;
    private readonly int _portRangeEnd;

    // Cache des ports enregistrés: "{userId}_{projectId}" -> port
    private static readonly ConcurrentDictionary<string, PortInfo> _portCache = new();

    private class PortInfo
    {
        public int Port { get; set; }
        public DateTime RegisteredAt { get; set; }
        public DateTime LastChecked { get; set; }
    }

    public PortDetectionService(IConfiguration configuration, ILogger<PortDetectionService> logger)
    {
        _logger = logger;

        // Lire la plage de ports depuis la configuration
        var portRange = configuration["AppProxy:PortRange"] ?? "3000-3100";
        var parts = portRange.Split('-');
        _portRangeStart = int.Parse(parts[0]);
        _portRangeEnd = int.Parse(parts[1]);
    }

    /// <summary>
    /// Génère la clé de cache pour un projet/utilisateur.
    /// </summary>
    private static string GetCacheKey(Guid projectId, Guid userId) => $"{userId}_{projectId}";

    /// <summary>
    /// Détecte le port de l'application. Utilise le cache ou scanne les ports.
    /// </summary>
    public int? DetectAppPort(Guid projectId, Guid userId)
    {
        var key = GetCacheKey(projectId, userId);

        // Vérifier le cache d'abord
        if (_portCache.TryGetValue(key, out var portInfo))
        {
            // Vérifier si le port est toujours actif (cache de 30 secondes)
            if ((DateTime.UtcNow - portInfo.LastChecked).TotalSeconds < 30)
            {
                return portInfo.Port;
            }

            // Revérifier si le port est toujours en écoute
            if (IsPortListening(portInfo.Port))
            {
                portInfo.LastChecked = DateTime.UtcNow;
                return portInfo.Port;
            }

            // Port plus actif, supprimer du cache
            _portCache.TryRemove(key, out _);
        }

        // Scanner les ports pour trouver une application active
        return ScanForActivePort();
    }

    /// <summary>
    /// Enregistre un port pour un projet (appelé quand une app démarre).
    /// </summary>
    public void RegisterPort(Guid projectId, Guid userId, int port)
    {
        var key = GetCacheKey(projectId, userId);
        _portCache[key] = new PortInfo
        {
            Port = port,
            RegisteredAt = DateTime.UtcNow,
            LastChecked = DateTime.UtcNow
        };
        _logger.LogInformation("Port {Port} enregistré pour le projet {ProjectId}", port, projectId);
    }

    /// <summary>
    /// Supprime l'enregistrement d'un port.
    /// </summary>
    public void UnregisterPort(Guid projectId, Guid userId)
    {
        var key = GetCacheKey(projectId, userId);
        if (_portCache.TryRemove(key, out var portInfo))
        {
            _logger.LogInformation("Port {Port} désenregistré pour le projet {ProjectId}", portInfo.Port, projectId);
        }
    }

    /// <summary>
    /// Vérifie si un port est en écoute.
    /// </summary>
    public bool IsPortListening(int port)
    {
        try
        {
            using var client = new TcpClient();
            var result = client.BeginConnect("127.0.0.1", port, null, null);
            var success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(100));

            if (success)
            {
                client.EndConnect(result);
                return true;
            }

            return false;
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Récupère le port enregistré sans scan.
    /// </summary>
    public int? GetRegisteredPort(Guid projectId, Guid userId)
    {
        var key = GetCacheKey(projectId, userId);
        return _portCache.TryGetValue(key, out var portInfo) ? portInfo.Port : null;
    }

    /// <summary>
    /// Scanne la plage de ports pour trouver une application active.
    /// </summary>
    private int? ScanForActivePort()
    {
        // Commencer par les ports les plus courants
        int[] commonPorts = { 3000, 3001, 5000, 5173, 8000, 8080, 4200 };

        foreach (var port in commonPorts)
        {
            if (port >= _portRangeStart && port <= _portRangeEnd && IsPortListening(port))
            {
                _logger.LogDebug("Port actif trouvé par scan: {Port}", port);
                return port;
            }
        }

        // Scanner le reste de la plage
        for (int port = _portRangeStart; port <= _portRangeEnd; port++)
        {
            if (!commonPorts.Contains(port) && IsPortListening(port))
            {
                _logger.LogDebug("Port actif trouvé par scan complet: {Port}", port);
                return port;
            }
        }

        return null;
    }
}
