using System.Diagnostics;
using System.Text;
using CloudCode.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service Git utilisant le CLI git via System.Diagnostics.Process.
/// Prérequis : git installé sur le serveur.
/// </summary>
public class GitService : IGitService
{
    private readonly ILogger<GitService> _logger;

    public GitService(ILogger<GitService> logger)
    {
        _logger = logger;
    }

    // ─── Core runner ──────────────────────────────────────────────────────────

    private async Task<(int exitCode, string stdout, string stderr)> RunGitAsync(
        string workDir, string arguments, CancellationToken ct = default,
        string? stdinData = null, Dictionary<string, string>? env = null)
    {
        using var process = new Process
        {
            StartInfo = new ProcessStartInfo
            {
                FileName = "git",
                Arguments = arguments,
                WorkingDirectory = workDir,
                RedirectStandardInput = stdinData != null,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                StandardOutputEncoding = Encoding.UTF8,
                StandardErrorEncoding = Encoding.UTF8,
            }
        };

        // Désactiver les prompts interactifs
        process.StartInfo.Environment["GIT_TERMINAL_PROMPT"] = "0";
        process.StartInfo.Environment["GIT_ASKPASS"] = "echo";

        if (env != null)
            foreach (var (k, v) in env)
                process.StartInfo.Environment[k] = v;

        process.Start();

        if (stdinData != null)
        {
            await process.StandardInput.WriteAsync(stdinData);
            process.StandardInput.Close();
        }

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(30));

        var stdout = await process.StandardOutput.ReadToEndAsync(cts.Token);
        var stderr = await process.StandardError.ReadToEndAsync(cts.Token);

        await process.WaitForExitAsync(cts.Token);

        return (process.ExitCode, stdout.Trim(), stderr.Trim());
    }

    // ─── Operations ───────────────────────────────────────────────────────────

    public async Task<GitOperationResult> InitAsync(string projectDir, CancellationToken ct = default)
    {
        Directory.CreateDirectory(projectDir);
        var (code, out_, err) = await RunGitAsync(projectDir, "init", ct);
        if (code == 0)
        {
            // Config locale pour les commits
            await RunGitAsync(projectDir, "config user.email cloudcode@ide.local", ct);
            await RunGitAsync(projectDir, "config user.name \"CloudCode\"", ct);
        }
        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    public async Task<GitStatusDto> GetStatusAsync(string projectDir, CancellationToken ct = default)
    {
        // Vérifier si c'est un repo git
        var (checkCode, _, _) = await RunGitAsync(projectDir, "rev-parse --git-dir", ct);
        if (checkCode != 0)
            return new GitStatusDto { IsRepo = false };

        var dto = new GitStatusDto { IsRepo = true };

        // Branch courante
        var (_, branch, _) = await RunGitAsync(projectDir, "branch --show-current", ct);
        dto.Branch = string.IsNullOrEmpty(branch) ? "main" : branch;

        // Remote URL
        var (remoteCode, remoteUrl, _) = await RunGitAsync(projectDir, "remote get-url origin", ct);
        if (remoteCode == 0) dto.RemoteUrl = remoteUrl;

        // Status porcelain
        var (_, statusOut, _) = await RunGitAsync(projectDir, "status --porcelain=v1", ct);
        foreach (var line in statusOut.Split('\n', StringSplitOptions.RemoveEmptyEntries))
        {
            if (line.Length < 4) continue;
            char staged = line[0];
            char unstaged = line[1];
            string path = line[3..].Trim();

            if (staged != ' ' && staged != '?')
                dto.Staged.Add(new GitFileStatus { Path = path, Status = staged.ToString() });

            if (unstaged != ' ')
            {
                if (unstaged == '?')
                    dto.Untracked.Add(new GitFileStatus { Path = path, Status = "?" });
                else
                    dto.Unstaged.Add(new GitFileStatus { Path = path, Status = unstaged.ToString() });
            }
        }

        // Ahead/Behind
        try
        {
            var (revCode, revOut, _) = await RunGitAsync(projectDir, $"rev-list --left-right --count origin/{dto.Branch}...HEAD", ct);
            if (revCode == 0)
            {
                var parts = revOut.Split('\t');
                if (parts.Length == 2)
                {
                    dto.BehindBy = int.TryParse(parts[0], out var b) ? b : 0;
                    dto.AheadBy = int.TryParse(parts[1], out var a) ? a : 0;
                }
            }
        }
        catch { /* ignore if no remote tracking */ }

        return dto;
    }

    public async Task<string> GetDiffAsync(string projectDir, string? filePath = null, CancellationToken ct = default)
    {
        var args = filePath != null ? $"diff HEAD -- \"{filePath}\"" : "diff HEAD";
        var (_, out_, _) = await RunGitAsync(projectDir, args, ct);
        return out_;
    }

    public async Task<GitOperationResult> StageAllAsync(string projectDir, CancellationToken ct = default)
    {
        var (code, out_, err) = await RunGitAsync(projectDir, "add -A", ct);
        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    public async Task<GitOperationResult> StageFileAsync(string projectDir, string filePath, CancellationToken ct = default)
    {
        var (code, out_, err) = await RunGitAsync(projectDir, $"add \"{filePath}\"", ct);
        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    public async Task<GitOperationResult> UnstageFileAsync(string projectDir, string filePath, CancellationToken ct = default)
    {
        var (code, out_, err) = await RunGitAsync(projectDir, $"reset HEAD \"{filePath}\"", ct);
        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    public async Task<GitOperationResult> CommitAsync(string projectDir, string message, string authorName, string authorEmail, CancellationToken ct = default)
    {
        var env = new Dictionary<string, string>
        {
            ["GIT_AUTHOR_NAME"] = authorName,
            ["GIT_AUTHOR_EMAIL"] = authorEmail,
            ["GIT_COMMITTER_NAME"] = authorName,
            ["GIT_COMMITTER_EMAIL"] = authorEmail,
        };

        // S'assurer qu'il y a quelque chose à commiter
        var (checkCode, checkOut, _) = await RunGitAsync(projectDir, "status --porcelain", ct);
        if (string.IsNullOrWhiteSpace(checkOut))
            return new GitOperationResult { Success = false, Error = "Rien à commiter — le working tree est propre." };

        var (code, out_, err) = await RunGitAsync(projectDir, $"commit -m \"{message.Replace("\"", "\\\"")}\"", ct, env: env);
        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    public async Task<GitOperationResult> PushAsync(string projectDir, string branch, string token, string username, CancellationToken ct = default)
    {
        // Récupérer l'URL remote et injecter le token
        var (_, remoteUrl, _) = await RunGitAsync(projectDir, "remote get-url origin", ct);

        if (string.IsNullOrEmpty(remoteUrl))
            return new GitOperationResult { Success = false, Error = "Aucun remote 'origin' configuré." };

        var authUrl = InjectCredentials(remoteUrl, username, token);
        await RunGitAsync(projectDir, $"remote set-url origin \"{authUrl}\"", ct);

        var (code, out_, err) = await RunGitAsync(projectDir, $"push origin {branch}", ct);

        // Restaurer l'URL sans credentials
        await RunGitAsync(projectDir, $"remote set-url origin \"{remoteUrl}\"", ct);

        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    public async Task<GitOperationResult> PullAsync(string projectDir, string branch, string token, string username, CancellationToken ct = default)
    {
        var (_, remoteUrl, _) = await RunGitAsync(projectDir, "remote get-url origin", ct);

        if (string.IsNullOrEmpty(remoteUrl))
            return new GitOperationResult { Success = false, Error = "Aucun remote 'origin' configuré." };

        var authUrl = InjectCredentials(remoteUrl, username, token);
        await RunGitAsync(projectDir, $"remote set-url origin \"{authUrl}\"", ct);

        var (code, out_, err) = await RunGitAsync(projectDir, $"pull origin {branch}", ct);

        await RunGitAsync(projectDir, $"remote set-url origin \"{remoteUrl}\"", ct);

        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    public async Task<List<string>> GetBranchesAsync(string projectDir, CancellationToken ct = default)
    {
        var (_, out_, _) = await RunGitAsync(projectDir, "branch -a --format=%(refname:short)", ct);
        return out_.Split('\n', StringSplitOptions.RemoveEmptyEntries).ToList();
    }

    public async Task<string> GetCurrentBranchAsync(string projectDir, CancellationToken ct = default)
    {
        var (_, out_, _) = await RunGitAsync(projectDir, "branch --show-current", ct);
        return string.IsNullOrEmpty(out_) ? "main" : out_;
    }

    public async Task<GitOperationResult> CheckoutBranchAsync(string projectDir, string branch, bool create, CancellationToken ct = default)
    {
        var args = create ? $"checkout -b {branch}" : $"checkout {branch}";
        var (code, out_, err) = await RunGitAsync(projectDir, args, ct);
        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    public async Task<List<GitCommitDto>> GetLogAsync(string projectDir, int limit = 20, CancellationToken ct = default)
    {
        var format = "%H|%h|%s|%an|%ar";
        var (_, out_, _) = await RunGitAsync(projectDir, $"log --oneline -n {limit} --format=\"{format}\"", ct);

        return out_.Split('\n', StringSplitOptions.RemoveEmptyEntries)
            .Select(line =>
            {
                var parts = line.Split('|');
                return parts.Length >= 5
                    ? new GitCommitDto { Hash = parts[0], ShortHash = parts[1], Message = parts[2], Author = parts[3], Date = parts[4] }
                    : new GitCommitDto { Hash = line, Message = line };
            })
            .ToList();
    }

    public async Task<GitOperationResult> SetRemoteAsync(string projectDir, string url, CancellationToken ct = default)
    {
        // Vérifier si origin existe déjà
        var (checkCode, _, _) = await RunGitAsync(projectDir, "remote get-url origin", ct);
        var gitCommand = checkCode == 0
            ? $"remote set-url origin \"{url}\""
            : $"remote add origin \"{url}\"";

        var (code, out_, err) = await RunGitAsync(projectDir, gitCommand, ct);
        return new GitOperationResult { Success = code == 0, Output = out_, Error = code != 0 ? err : null };
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private static string InjectCredentials(string url, string username, string token)
    {
        if (!url.StartsWith("https://")) return url;
        // https://github.com/user/repo → https://username:token@github.com/user/repo
        return url.Replace("https://", $"https://{Uri.EscapeDataString(username)}:{Uri.EscapeDataString(token)}@");
    }
}
