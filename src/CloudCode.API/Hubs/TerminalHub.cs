using CloudCode.Application.Interfaces;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Win32.SafeHandles;
using System.Collections.Concurrent;
using System.ComponentModel;
using System.Runtime.InteropServices;
using System.Text;

namespace CloudCode.Hubs;

[Authorize]
public class TerminalHub : Hub
{
    private static readonly ConcurrentDictionary<string, ConPtyTerminal> Sessions = new();
    private readonly IConfiguration _configuration;
    private readonly IHubContext<TerminalHub> _hubContext;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileService _fileService;
    private readonly ILogger<TerminalHub> _logger;

    public TerminalHub(
        IConfiguration configuration,
        IHubContext<TerminalHub> hubContext,
        IUnitOfWork unitOfWork,
        IFileService fileService,
        ILogger<TerminalHub> logger)
    {
        _configuration = configuration;
        _hubContext = hubContext;
        _unitOfWork = unitOfWork;
        _fileService = fileService;
        _logger = logger;
    }

    /// <summary>
    /// Crée une nouvelle session terminal. Supporte plusieurs terminaux par projet.
    /// </summary>
    /// <param name="projectId">ID du projet</param>
    /// <param name="terminalId">ID unique du terminal (optionnel, généré si null)</param>
    public async Task CreateSession(Guid projectId, string? terminalId = null)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        // Générer un ID si non fourni
        terminalId ??= Guid.NewGuid().ToString("N")[..8];
        var sessionKey = GetSessionKey(userId, projectId, terminalId);
        var connectionId = Context.ConnectionId;

        // Supprimer l'ancienne session si elle existe (même terminalId)
        if (Sessions.TryRemove(sessionKey, out var existingSession))
        {
            existingSession.Dispose();
        }

        var workDir = GetProjectWorkingDirectory(projectId);
        Directory.CreateDirectory(workDir);

        var project = await _unitOfWork.Projects.GetByIdAsync(projectId);
        var projectLanguage = project?.Language ?? ProgrammingLanguage.JavaScript;

        // Synchroniser les fichiers du projet vers le répertoire de travail (seulement pour le premier terminal)
        var isFirstTerminal = !Sessions.Keys.Any(k => k.StartsWith($"{userId}_{projectId}_"));
        if (isFirstTerminal)
        {
            try
            {
                await _fileService.SyncToWorkingDirectoryAsync(projectId, Guid.Parse(userId));
                _logger.LogInformation("Fichiers synchronisés pour le projet {ProjectId}", projectId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Erreur lors de la synchronisation des fichiers");
            }
        }

        var terminal = new ConPtyTerminal(connectionId, _hubContext, _logger, terminalId);

        try
        {
            terminal.Start(workDir, 120, 30);
            Sessions[sessionKey] = terminal;

            await Clients.Caller.SendAsync("TerminalReady", new
            {
                SessionId = sessionKey,
                TerminalId = terminalId,
                WorkingDirectory = workDir,
                Shell = "powershell.exe"
            });

            var welcome = BuildWelcomeMessage(workDir, projectLanguage);
            await Clients.Caller.SendAsync("TerminalOutput", welcome);

            // Auto-activer le venv pour les projets Python
            if (projectLanguage == ProgrammingLanguage.Python)
            {
                var venvActivate = Path.Combine(workDir, "venv", "Scripts", "Activate.ps1");
                if (File.Exists(venvActivate))
                {
                    var terminalRef = terminal;
                    _ = Task.Run(async () =>
                    {
                        await Task.Delay(1500); // laisser PowerShell démarrer
                        terminalRef.Write($". \"{venvActivate}\"\r\n");
                    });
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur creation terminal");
            await Clients.Caller.SendAsync("TerminalError", $"Erreur: {ex.Message}");
        }
    }

    /// <summary>
    /// Envoie une entrée utilisateur au terminal spécifié.
    /// </summary>
    public async Task SendInput(Guid projectId, string terminalId, string input)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        var sessionKey = GetSessionKey(userId, projectId, terminalId);

        if (Sessions.TryGetValue(sessionKey, out var terminal))
        {
            terminal.Write(input);
        }
        else
        {
            await Clients.Caller.SendAsync("TerminalError", $"Session '{terminalId}' non trouvée.");
        }
    }

    /// <summary>
    /// Redimensionne le terminal spécifié.
    /// </summary>
    public Task ResizeTerminal(Guid projectId, string terminalId, int cols, int rows)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Task.CompletedTask;

        var sessionKey = GetSessionKey(userId, projectId, terminalId);

        if (Sessions.TryGetValue(sessionKey, out var terminal))
        {
            terminal.Resize(cols, rows);
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Ferme un terminal spécifique.
    /// </summary>
    public async Task CloseSession(Guid projectId, string terminalId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return;

        var sessionKey = GetSessionKey(userId, projectId, terminalId);

        if (Sessions.TryRemove(sessionKey, out var terminal))
        {
            terminal.Dispose();
            await Clients.Caller.SendAsync("TerminalClosed", terminalId);
        }
    }

    /// <summary>
    /// Liste tous les terminaux actifs pour un projet.
    /// </summary>
    public Task<List<TerminalSessionInfo>> ListSessions(Guid projectId)
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId)) return Task.FromResult(new List<TerminalSessionInfo>());

        var prefix = $"{userId}_{projectId}_";
        var sessions = Sessions
            .Where(s => s.Key.StartsWith(prefix))
            .Select(s => new TerminalSessionInfo
            {
                TerminalId = s.Value.TerminalId,
                CreatedAt = s.Value.CreatedAt
            })
            .OrderBy(s => s.CreatedAt)
            .ToList();

        return Task.FromResult(sessions);
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (!string.IsNullOrEmpty(userId))
        {
            var userSessions = Sessions.Keys.Where(k => k.StartsWith(userId)).ToList();
            foreach (var sessionId in userSessions)
            {
                if (Sessions.TryRemove(sessionId, out var terminal))
                {
                    terminal.Dispose();
                }
            }
        }

        return base.OnDisconnectedAsync(exception);
    }

    private string? GetUserId() => Context.User?.FindFirst("userId")?.Value;

    private static string GetSessionKey(string userId, Guid projectId, string terminalId)
        => $"{userId}_{projectId}_{terminalId}";

    private string GetProjectWorkingDirectory(Guid projectId)
    {
        var configuredDir = _configuration.GetValue<string>("Terminal:WorkingDirectory");
        var baseDir = !string.IsNullOrEmpty(configuredDir)
            ? configuredDir
            : Path.Combine(Path.GetTempPath(), "cloudcode_projects");
        return Path.Combine(baseDir, projectId.ToString());
    }

    private string BuildWelcomeMessage(string workDir, ProgrammingLanguage lang)
    {
        var sb = new StringBuilder();
        sb.Append("\x1b[36m=== CloudCode Terminal ===\x1b[0m\r\n");
        sb.Append($"Repertoire: {workDir}\r\n");
        sb.Append("\x1b[90mCtrl+C: Interrompre | Ctrl+L: Effacer | Tab: Completion | Fleches: Historique\x1b[0m\r\n\r\n");

        if (lang == ProgrammingLanguage.Python)
        {
            var venvExists = Directory.Exists(Path.Combine(workDir, "venv"));
            if (venvExists)
                sb.Append("\x1b[32m[Python] venv detecte - activation automatique...\x1b[0m\r\n\r\n");
            else
                sb.Append("\x1b[33m[Python]\x1b[0m Creez un venv: \x1b[33mpython -m venv venv\x1b[0m\r\n\r\n");
        }
        else if (lang == ProgrammingLanguage.JavaScript || lang == ProgrammingLanguage.TypeScript)
        {
            if (!File.Exists(Path.Combine(workDir, "package.json")))
                sb.Append("\x1b[33m[Node.js]\x1b[0m Initialisez: \x1b[33mnpm init -y\x1b[0m\r\n\r\n");
            else if (!Directory.Exists(Path.Combine(workDir, "node_modules")))
                sb.Append("\x1b[33m[Node.js]\x1b[0m Installez: \x1b[33mnpm install\x1b[0m\r\n\r\n");
        }

        return sb.ToString();
    }
}

public class ConPtyTerminal : IDisposable
{
    private readonly string _connectionId;
    private readonly IHubContext<TerminalHub> _hubContext;
    private readonly ILogger _logger;

    private SafeFileHandle? _inputWriteHandle;
    private SafeFileHandle? _outputReadHandle;
    private FileStream? _inputStream;
    private FileStream? _outputStream;
    private IntPtr _ptyHandle;
    private IntPtr _processHandle;
    private Thread? _readThread;
    private volatile bool _disposed;

    /// <summary>
    /// Identifiant unique du terminal (pour multi-terminal).
    /// </summary>
    public string TerminalId { get; }

    /// <summary>
    /// Date de création du terminal.
    /// </summary>
    public DateTime CreatedAt { get; }

    public ConPtyTerminal(string connectionId, IHubContext<TerminalHub> hubContext, ILogger logger, string terminalId)
    {
        _connectionId = connectionId;
        _hubContext = hubContext;
        _logger = logger;
        TerminalId = terminalId;
        CreatedAt = DateTime.UtcNow;
    }

    public void Start(string workingDirectory, int cols, int rows)
    {
        // Creer les pipes
        if (!CreatePipe(out var inputReadHandle, out _inputWriteHandle, IntPtr.Zero, 0))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "CreatePipe input failed");

        if (!CreatePipe(out _outputReadHandle, out var outputWriteHandle, IntPtr.Zero, 0))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "CreatePipe output failed");

        // Creer le pseudo console
        var size = new COORD { X = (short)cols, Y = (short)rows };
        int hr = CreatePseudoConsole(size, inputReadHandle, outputWriteHandle, 0, out _ptyHandle);

        if (hr != 0)
            throw new Win32Exception(hr, $"CreatePseudoConsole failed: {hr}");

        // Fermer les cotes non utilises des pipes
        inputReadHandle.Dispose();
        outputWriteHandle.Dispose();

        // Creer les streams (garder ouverts!)
        _inputStream = new FileStream(_inputWriteHandle, FileAccess.Write, 256, false);
        _outputStream = new FileStream(_outputReadHandle, FileAccess.Read, 256, false);

        // Demarrer PowerShell
        StartProcess(workingDirectory);

        // Demarrer la lecture en arriere-plan
        _readThread = new Thread(ReadOutputLoop) { IsBackground = true, Name = "PTY-Reader" };
        _readThread.Start();

        _logger.LogInformation("ConPTY started for connection {ConnectionId}", _connectionId);
    }

    private void StartProcess(string workingDirectory)
    {
        var startupInfo = new STARTUPINFOEX();
        startupInfo.StartupInfo.cb = Marshal.SizeOf<STARTUPINFOEX>();

        // Allouer l'attribut list
        IntPtr attrListSize = IntPtr.Zero;
        InitializeProcThreadAttributeList(IntPtr.Zero, 1, 0, ref attrListSize);

        startupInfo.lpAttributeList = Marshal.AllocHGlobal(attrListSize);

        try
        {
            if (!InitializeProcThreadAttributeList(startupInfo.lpAttributeList, 1, 0, ref attrListSize))
                throw new Win32Exception(Marshal.GetLastWin32Error());

            if (!UpdateProcThreadAttribute(
                startupInfo.lpAttributeList,
                0,
                (IntPtr)PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE,
                _ptyHandle,
                (IntPtr)IntPtr.Size,
                IntPtr.Zero,
                IntPtr.Zero))
            {
                throw new Win32Exception(Marshal.GetLastWin32Error());
            }

            string command = "powershell.exe -NoLogo -ExecutionPolicy Bypass";

            if (!CreateProcess(
                null,
                command,
                IntPtr.Zero,
                IntPtr.Zero,
                false,
                EXTENDED_STARTUPINFO_PRESENT,
                IntPtr.Zero,
                workingDirectory,
                ref startupInfo,
                out var processInfo))
            {
                throw new Win32Exception(Marshal.GetLastWin32Error());
            }

            _processHandle = processInfo.hProcess;
            CloseHandle(processInfo.hThread);
        }
        finally
        {
            DeleteProcThreadAttributeList(startupInfo.lpAttributeList);
            Marshal.FreeHGlobal(startupInfo.lpAttributeList);
        }
    }

    private void ReadOutputLoop()
    {
        var buffer = new byte[4096];

        try
        {
            while (!_disposed && _outputStream != null)
            {
                int bytesRead = _outputStream.Read(buffer, 0, buffer.Length);
                if (bytesRead == 0) break;

                var output = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                SendOutputAsync(output).Wait();
            }
        }
        catch (Exception ex)
        {
            if (!_disposed)
            {
                _logger.LogError(ex, "Error reading PTY output");
            }
        }
    }

    private async Task SendOutputAsync(string output)
    {
        try
        {
            await _hubContext.Clients.Client(_connectionId).SendAsync("TerminalOutput", output);
        }
        catch { }
    }

    public void Write(string input)
    {
        if (_disposed || _inputStream == null) return;

        try
        {
            var bytes = Encoding.UTF8.GetBytes(input);
            _inputStream.Write(bytes, 0, bytes.Length);
            _inputStream.Flush();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing to PTY");
        }
    }

    public void Resize(int cols, int rows)
    {
        if (_disposed || _ptyHandle == IntPtr.Zero) return;

        var size = new COORD { X = (short)cols, Y = (short)rows };
        ResizePseudoConsole(_ptyHandle, size);
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        try
        {
            // Fermer le PTY d'abord
            if (_ptyHandle != IntPtr.Zero)
            {
                ClosePseudoConsole(_ptyHandle);
                _ptyHandle = IntPtr.Zero;
            }

            // Terminer le processus
            if (_processHandle != IntPtr.Zero)
            {
                TerminateProcess(_processHandle, 0);
                CloseHandle(_processHandle);
                _processHandle = IntPtr.Zero;
            }

            // Fermer les streams
            _inputStream?.Dispose();
            _outputStream?.Dispose();
            _inputWriteHandle?.Dispose();
            _outputReadHandle?.Dispose();
        }
        catch { }

        GC.SuppressFinalize(this);
    }

    #region Native Methods

    private const uint EXTENDED_STARTUPINFO_PRESENT = 0x00080000;
    private const int PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE = 0x00020016;

    [StructLayout(LayoutKind.Sequential)]
    private struct COORD { public short X, Y; }

    [StructLayout(LayoutKind.Sequential)]
    private struct PROCESS_INFORMATION
    {
        public IntPtr hProcess, hThread;
        public int dwProcessId, dwThreadId;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct STARTUPINFO
    {
        public int cb;
        public IntPtr lpReserved, lpDesktop, lpTitle;
        public int dwX, dwY, dwXSize, dwYSize, dwXCountChars, dwYCountChars, dwFillAttribute, dwFlags;
        public short wShowWindow, cbReserved2;
        public IntPtr lpReserved2, hStdInput, hStdOutput, hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct STARTUPINFOEX
    {
        public STARTUPINFO StartupInfo;
        public IntPtr lpAttributeList;
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern int CreatePseudoConsole(COORD size, SafeFileHandle hInput, SafeFileHandle hOutput, uint dwFlags, out IntPtr phPC);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern int ResizePseudoConsole(IntPtr hPC, COORD size);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern void ClosePseudoConsole(IntPtr hPC);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CreatePipe(out SafeFileHandle hReadPipe, out SafeFileHandle hWritePipe, IntPtr lpPipeAttributes, uint nSize);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool InitializeProcThreadAttributeList(IntPtr lpAttributeList, int dwAttributeCount, int dwFlags, ref IntPtr lpSize);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool UpdateProcThreadAttribute(IntPtr lpAttributeList, uint dwFlags, IntPtr Attribute, IntPtr lpValue, IntPtr cbSize, IntPtr lpPreviousValue, IntPtr lpReturnSize);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern void DeleteProcThreadAttributeList(IntPtr lpAttributeList);

    [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
    private static extern bool CreateProcess(string? lpApplicationName, string lpCommandLine, IntPtr lpProcessAttributes, IntPtr lpThreadAttributes, bool bInheritHandles, uint dwCreationFlags, IntPtr lpEnvironment, string lpCurrentDirectory, ref STARTUPINFOEX lpStartupInfo, out PROCESS_INFORMATION lpProcessInformation);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool TerminateProcess(IntPtr hProcess, uint uExitCode);

    #endregion
}

/// <summary>
/// Informations sur une session terminal active.
/// </summary>
public class TerminalSessionInfo
{
    public string TerminalId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
