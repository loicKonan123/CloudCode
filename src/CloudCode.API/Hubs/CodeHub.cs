using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace CloudCode.Hubs;

/// <summary>
/// Hub SignalR pour la collaboration en temps réel sur le code.
/// </summary>
[Authorize]
public class CodeHub : Hub
{
    // Stockage des utilisateurs actifs par projet
    private static readonly ConcurrentDictionary<string, HashSet<ConnectedUser>> ProjectUsers = new();

    /// <summary>
    /// Rejoindre un projet pour la collaboration.
    /// </summary>
    public async Task JoinProject(Guid projectId)
    {
        var groupName = GetGroupName(projectId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        var user = GetCurrentUser();
        if (user != null)
        {
            // Ajouter l'utilisateur au projet
            ProjectUsers.AddOrUpdate(
                groupName,
                _ => new HashSet<ConnectedUser> { user },
                (_, users) =>
                {
                    users.Add(user);
                    return users;
                });

            // Notifier les autres utilisateurs
            await Clients.OthersInGroup(groupName).SendAsync("UserJoined", user);

            // Envoyer la liste des utilisateurs actifs
            var activeUsers = ProjectUsers.GetValueOrDefault(groupName)?.ToList() ?? new List<ConnectedUser>();
            await Clients.Caller.SendAsync("ActiveUsers", activeUsers);
        }
    }

    /// <summary>
    /// Quitter un projet.
    /// </summary>
    public async Task LeaveProject(Guid projectId)
    {
        var groupName = GetGroupName(projectId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        var user = GetCurrentUser();
        if (user != null)
        {
            RemoveUserFromProject(groupName, user);
            await Clients.OthersInGroup(groupName).SendAsync("UserLeft", user);
        }
    }

    /// <summary>
    /// Envoyer une modification de code aux autres utilisateurs.
    /// </summary>
    public async Task SendCodeChange(Guid projectId, Guid fileId, CodeChange change)
    {
        var groupName = GetGroupName(projectId);
        var user = GetCurrentUser();

        if (user != null)
        {
            await Clients.OthersInGroup(groupName).SendAsync("CodeChanged", new
            {
                FileId = fileId,
                User = user,
                Change = change,
                Timestamp = DateTime.UtcNow
            });
        }
    }

    /// <summary>
    /// Envoyer la position du curseur.
    /// </summary>
    public async Task SendCursorPosition(Guid projectId, Guid fileId, CursorPosition position)
    {
        var groupName = GetGroupName(projectId);
        var user = GetCurrentUser();

        if (user != null)
        {
            await Clients.OthersInGroup(groupName).SendAsync("CursorMoved", new
            {
                FileId = fileId,
                User = user,
                Position = position
            });
        }
    }

    /// <summary>
    /// Envoyer une sélection de texte.
    /// </summary>
    public async Task SendSelection(Guid projectId, Guid fileId, TextSelection selection)
    {
        var groupName = GetGroupName(projectId);
        var user = GetCurrentUser();

        if (user != null)
        {
            await Clients.OthersInGroup(groupName).SendAsync("SelectionChanged", new
            {
                FileId = fileId,
                User = user,
                Selection = selection
            });
        }
    }

    /// <summary>
    /// Notification de création/suppression de fichier.
    /// </summary>
    public async Task NotifyFileChange(Guid projectId, string changeType, object fileInfo)
    {
        var groupName = GetGroupName(projectId);
        var user = GetCurrentUser();

        if (user != null)
        {
            await Clients.OthersInGroup(groupName).SendAsync("FileChanged", new
            {
                ChangeType = changeType, // "created", "deleted", "renamed"
                User = user,
                File = fileInfo
            });
        }
    }

    /// <summary>
    /// Envoyer un message de chat.
    /// </summary>
    public async Task SendChatMessage(Guid projectId, string message)
    {
        var groupName = GetGroupName(projectId);
        var user = GetCurrentUser();

        if (user != null && !string.IsNullOrWhiteSpace(message))
        {
            await Clients.Group(groupName).SendAsync("ChatMessage", new
            {
                User = user,
                Message = message.Trim(),
                Timestamp = DateTime.UtcNow
            });
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var user = GetCurrentUser();

        if (user != null)
        {
            // Retirer l'utilisateur de tous les projets
            foreach (var (groupName, users) in ProjectUsers)
            {
                if (users.Contains(user))
                {
                    RemoveUserFromProject(groupName, user);
                    await Clients.Group(groupName).SendAsync("UserLeft", user);
                }
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    #region Private Methods

    private string GetGroupName(Guid projectId) => $"project_{projectId}";

    private ConnectedUser? GetCurrentUser()
    {
        var userId = Context.User?.FindFirst("userId")?.Value;
        var username = Context.User?.FindFirst("unique_name")?.Value
            ?? Context.User?.Identity?.Name;

        if (string.IsNullOrEmpty(userId)) return null;

        return new ConnectedUser
        {
            Id = Guid.Parse(userId),
            Username = username ?? "Anonymous",
            ConnectionId = Context.ConnectionId,
            Color = GenerateUserColor(userId)
        };
    }

    private void RemoveUserFromProject(string groupName, ConnectedUser user)
    {
        if (ProjectUsers.TryGetValue(groupName, out var users))
        {
            users.RemoveWhere(u => u.ConnectionId == user.ConnectionId);
            if (users.Count == 0)
            {
                ProjectUsers.TryRemove(groupName, out _);
            }
        }
    }

    private string GenerateUserColor(string seed)
    {
        var hash = seed.GetHashCode();
        var colors = new[]
        {
            "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
            "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
            "#BB8FCE", "#85C1E9", "#F8B500", "#00CED1"
        };
        return colors[Math.Abs(hash) % colors.Length];
    }

    #endregion
}

#region DTOs

public class ConnectedUser
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string ConnectionId { get; set; } = string.Empty;
    public string Color { get; set; } = "#4ECDC4";

    public override bool Equals(object? obj)
    {
        return obj is ConnectedUser user && ConnectionId == user.ConnectionId;
    }

    public override int GetHashCode() => ConnectionId.GetHashCode();
}

public class CodeChange
{
    public int StartLine { get; set; }
    public int StartColumn { get; set; }
    public int EndLine { get; set; }
    public int EndColumn { get; set; }
    public string Text { get; set; } = string.Empty;
    public string RangeText { get; set; } = string.Empty; // Texte remplacé
}

public class CursorPosition
{
    public int Line { get; set; }
    public int Column { get; set; }
}

public class TextSelection
{
    public int StartLine { get; set; }
    public int StartColumn { get; set; }
    public int EndLine { get; set; }
    public int EndColumn { get; set; }
}

#endregion
