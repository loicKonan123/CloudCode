using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace CloudCode.Hubs;

/// <summary>
/// Hub SignalR pour le terminal interactif.
/// Permet d'executer des commandes shell en temps reel.
/// </summary>
[Authorize]
public class TerminalHub : Hub
{
    private static readonly ConcurrentDictionary<string, TerminalSession> Sessions = new();
    private readonly IConfiguration _configuration;
    private readonly IHubContext<TerminalHub> _hubContext;

    public TerminalHub(IConfiguration configuration, IHubContext<TerminalHub> hubContext)
    {
        _configuration = configuration;
        _hubContext = hubContext;
    }

    /// <summary>
    /// Creer une nouvelle session terminal pour un projet.
    /// </summary>
    public async Task CreateSession(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        var sessionId = $"{userId}_{projectId}";
        var connectionId = Context.ConnectionId;

        // Fermer la session existante si elle existe
        if (Sessions.TryRemove(sessionId, out var existingSession))
        {
            existingSession.Dispose();
        }

        // Creer le repertoire de travail du projet
        var workDir = GetProjectWorkingDirectory(projectId);
        Directory.CreateDirectory(workDir);

        // Determiner le shell a utiliser
        var shell = GetShellCommand();

        var session = new TerminalSession(sessionId, shell, workDir, connectionId, _hubContext);

        Sessions[sessionId] = session;
        session.Start();

        await Clients.Caller.SendAsync("TerminalReady", new
        {
            SessionId = sessionId,
            WorkingDirectory = workDir,
            Shell = shell
        });

        // Envoyer un message de bienvenue
        await Clients.Caller.SendAsync("TerminalOutput", $"Terminal connecte - {shell}\r\nRepertoire: {workDir}\r\n\r\n");
    }

    /// <summary>
    /// Envoyer une commande au terminal.
    /// </summary>
    public async Task SendInput(Guid projectId, string input)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        var sessionId = $"{userId}_{projectId}";

        if (Sessions.TryGetValue(sessionId, out var session))
        {
            await session.WriteInput(input);
        }
        else
        {
            await Clients.Caller.SendAsync("TerminalError", "Session non trouvee. Veuillez reconnecter le terminal.");
        }
    }

    /// <summary>
    /// Redimensionner le terminal.
    /// </summary>
    public Task ResizeTerminal(Guid projectId, int cols, int rows)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Task.CompletedTask;

        var sessionId = $"{userId}_{projectId}";

        if (Sessions.TryGetValue(sessionId, out var session))
        {
            session.Resize(cols, rows);
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Fermer la session terminal.
    /// </summary>
    public async Task CloseSession(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        var sessionId = $"{userId}_{projectId}";

        if (Sessions.TryRemove(sessionId, out var session))
        {
            session.Dispose();
            await Clients.Caller.SendAsync("TerminalClosed");
        }
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            // Fermer toutes les sessions de l'utilisateur
            var userSessions = Sessions.Keys.Where(k => k.StartsWith(userId)).ToList();
            foreach (var sessionId in userSessions)
            {
                if (Sessions.TryRemove(sessionId, out var session))
                {
                    session.Dispose();
                }
            }
        }

        return base.OnDisconnectedAsync(exception);
    }

    #region Private Methods

    private string? GetUserId()
    {
        return Context.User?.FindFirst("userId")?.Value;
    }

    private string GetProjectWorkingDirectory(Guid projectId)
    {
        var baseDir = _configuration.GetValue<string>("Terminal:WorkingDirectory")
            ?? Path.Combine(Path.GetTempPath(), "cloudcode_projects");
        return Path.Combine(baseDir, projectId.ToString());
    }

    private string GetShellCommand()
    {
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return "powershell.exe";
        }
        else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
        {
            return "/bin/zsh";
        }
        else
        {
            return "/bin/bash";
        }
    }

    #endregion
}

/// <summary>
/// Session de terminal interactive.
/// </summary>
public class TerminalSession : IDisposable
{
    private readonly string _sessionId;
    private readonly string _connectionId;
    private readonly IHubContext<TerminalHub> _hubContext;
    private readonly Process _process;
    private bool _disposed;
    private readonly System.Text.StringBuilder _inputBuffer = new();
    private readonly object _bufferLock = new();

    public TerminalSession(string sessionId, string shell, string workingDirectory, string connectionId, IHubContext<TerminalHub> hubContext)
    {
        _sessionId = sessionId;
        _connectionId = connectionId;
        _hubContext = hubContext;

        var isWindows = RuntimeInformation.IsOSPlatform(OSPlatform.Windows);

        _process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = shell,
                WorkingDirectory = workingDirectory,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                Environment =
                {
                    ["TERM"] = "xterm-256color",
                    ["COLORTERM"] = "truecolor"
                }
            },
            EnableRaisingEvents = true
        };

        // Pour PowerShell, configurer le prompt
        if (isWindows && shell.Contains("powershell", StringComparison.OrdinalIgnoreCase))
        {
            _process.StartInfo.Arguments = "-NoLogo -NoProfile";
        }
    }

    public void Start()
    {
        _process.OutputDataReceived += (sender, e) =>
        {
            if (e.Data != null && !_disposed)
            {
                _ = SendOutputSafe(e.Data + "\r\n");
            }
        };

        _process.ErrorDataReceived += (sender, e) =>
        {
            if (e.Data != null && !_disposed)
            {
                _ = SendErrorSafe(e.Data + "\r\n");
            }
        };

        _process.Exited += (sender, e) =>
        {
            if (!_disposed)
            {
                _ = SendExitSafe(_process.ExitCode);
            }
        };

        _process.Start();
        _process.BeginOutputReadLine();
        _process.BeginErrorReadLine();
    }

    private async Task SendOutputSafe(string output)
    {
        try
        {
            await _hubContext.Clients.Client(_connectionId).SendAsync("TerminalOutput", output);
        }
        catch
        {
            // Connection might be closed, ignore
        }
    }

    private async Task SendErrorSafe(string error)
    {
        try
        {
            await _hubContext.Clients.Client(_connectionId).SendAsync("TerminalError", error);
        }
        catch
        {
            // Connection might be closed, ignore
        }
    }

    private async Task SendExitSafe(int exitCode)
    {
        try
        {
            await _hubContext.Clients.Client(_connectionId).SendAsync("TerminalExit", exitCode);
        }
        catch
        {
            // Connection might be closed, ignore
        }
    }

    public async Task WriteInput(string input)
    {
        if (_disposed || _process.HasExited) return;

        try
        {
            foreach (char c in input)
            {
                // Handle Enter key (carriage return or newline)
                if (c == '\r' || c == '\n')
                {
                    string command;
                    lock (_bufferLock)
                    {
                        command = _inputBuffer.ToString();
                        _inputBuffer.Clear();
                    }

                    // Echo newline to terminal
                    _ = SendOutputSafe("\r\n");

                    // Send command to process
                    await _process.StandardInput.WriteLineAsync(command);
                    await _process.StandardInput.FlushAsync();
                }
                // Handle Backspace
                else if (c == '\x7f' || c == '\b')
                {
                    lock (_bufferLock)
                    {
                        if (_inputBuffer.Length > 0)
                        {
                            _inputBuffer.Length--;
                            // Echo backspace: move back, space, move back
                            _ = SendOutputSafe("\b \b");
                        }
                    }
                }
                // Handle Ctrl+C
                else if (c == '\x03')
                {
                    lock (_bufferLock)
                    {
                        _inputBuffer.Clear();
                    }
                    _ = SendOutputSafe("^C\r\n");
                    // Note: Proper Ctrl+C handling would require ConPTY
                }
                // Handle Ctrl+L (clear screen)
                else if (c == '\x0c')
                {
                    _ = SendOutputSafe("\x1b[2J\x1b[H");
                }
                // Regular printable characters
                else if (c >= 32 && c < 127)
                {
                    lock (_bufferLock)
                    {
                        _inputBuffer.Append(c);
                    }
                    // Echo character to terminal
                    _ = SendOutputSafe(c.ToString());
                }
                // Escape sequences (arrow keys, etc.) - ignore for now
                // Would need proper PTY for full support
            }
        }
        catch
        {
            // Process might have exited
        }
    }

    public void Resize(int cols, int rows)
    {
        // Note: Le redimensionnement PTY n'est pas supporte nativement dans .NET
        // Cela necessiterait une bibliotheque PTY comme Pty.Net
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        try
        {
            if (!_process.HasExited)
            {
                _process.Kill(true);
            }
            _process.Dispose();
        }
        catch { }
    }
}
