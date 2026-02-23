namespace CloudCode.Application.Interfaces;

public class GitStatusDto
{
    public bool IsRepo { get; set; }
    public string Branch { get; set; } = "main";
    public string? RemoteUrl { get; set; }
    public List<GitFileStatus> Staged { get; set; } = [];
    public List<GitFileStatus> Unstaged { get; set; } = [];
    public List<GitFileStatus> Untracked { get; set; } = [];
    public int AheadBy { get; set; }
    public int BehindBy { get; set; }
}

public class GitFileStatus
{
    public string Path { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty; // "M", "A", "D", "R", "?"
}

public class GitCommitDto
{
    public string Hash { get; set; } = string.Empty;
    public string ShortHash { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Date { get; set; } = string.Empty;
}

public class GitOperationResult
{
    public bool Success { get; set; }
    public string Output { get; set; } = string.Empty;
    public string? Error { get; set; }
}

/// <summary>
/// Service Git : init, status, diff, add, commit, push, pull, branches.
/// </summary>
public interface IGitService
{
    Task<GitOperationResult> InitAsync(string projectDir, CancellationToken ct = default);
    Task<GitStatusDto> GetStatusAsync(string projectDir, CancellationToken ct = default);
    Task<string> GetDiffAsync(string projectDir, string? filePath = null, CancellationToken ct = default);
    Task<GitOperationResult> StageAllAsync(string projectDir, CancellationToken ct = default);
    Task<GitOperationResult> StageFileAsync(string projectDir, string filePath, CancellationToken ct = default);
    Task<GitOperationResult> UnstageFileAsync(string projectDir, string filePath, CancellationToken ct = default);
    Task<GitOperationResult> CommitAsync(string projectDir, string message, string authorName, string authorEmail, CancellationToken ct = default);
    Task<GitOperationResult> PushAsync(string projectDir, string branch, string token, string username, CancellationToken ct = default);
    Task<GitOperationResult> PullAsync(string projectDir, string branch, string token, string username, CancellationToken ct = default);
    Task<List<string>> GetBranchesAsync(string projectDir, CancellationToken ct = default);
    Task<string> GetCurrentBranchAsync(string projectDir, CancellationToken ct = default);
    Task<GitOperationResult> CheckoutBranchAsync(string projectDir, string branch, bool create, CancellationToken ct = default);
    Task<List<GitCommitDto>> GetLogAsync(string projectDir, int limit = 20, CancellationToken ct = default);
    Task<GitOperationResult> SetRemoteAsync(string projectDir, string url, CancellationToken ct = default);
}
