using System.Diagnostics;
using System.Text;
using CloudCode.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service de formatage du code source via des outils externes (Black, Prettier, gofmt, rustfmt).
/// </summary>
public class FormattingService : IFormattingService
{
    private readonly ILogger<FormattingService> _logger;

    public FormattingService(ILogger<FormattingService> logger)
    {
        _logger = logger;
    }

    public async Task<FormattingResult> FormatAsync(string code, string language, CancellationToken cancellationToken = default)
    {
        var (command, args, useStdin) = GetFormatterConfig(language.ToLowerInvariant());

        if (command == null)
        {
            return new FormattingResult
            {
                FormattedCode = code,
                Success = false,
                Error = $"Aucun formateur disponible pour le langage '{language}'.",
            };
        }

        try
        {
            // Écrire dans un fichier temp si le formateur ne supporte pas stdin
            string? tempFile = null;
            string actualArgs = args;

            if (!useStdin)
            {
                tempFile = Path.GetTempFileName() + GetExtension(language);
                await File.WriteAllTextAsync(tempFile, code, Encoding.UTF8, cancellationToken);
                actualArgs = args.Replace("{file}", tempFile);
            }

            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = command,
                    Arguments = actualArgs,
                    RedirectStandardInput = useStdin,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8,
                }
            };

            process.Start();

            if (useStdin)
            {
                await process.StandardInput.WriteAsync(code);
                process.StandardInput.Close();
            }

            var outputTask = process.StandardOutput.ReadToEndAsync(cancellationToken);
            var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(TimeSpan.FromSeconds(15));

            await process.WaitForExitAsync(cts.Token);

            string output = await outputTask;
            string error = await errorTask;

            // Lire le fichier temp si on n'utilisait pas stdin
            if (!useStdin && tempFile != null)
            {
                output = await File.ReadAllTextAsync(tempFile, Encoding.UTF8, cancellationToken);
                File.Delete(tempFile);
            }

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("Formatter {Command} exited with code {Code}: {Error}", command, process.ExitCode, error);
                return new FormattingResult
                {
                    FormattedCode = code,
                    Success = false,
                    Error = error.Trim().Length > 0 ? error.Trim() : $"Le formateur a retourné le code {process.ExitCode}.",
                };
            }

            return new FormattingResult
            {
                FormattedCode = useStdin ? output : output,
                Success = true,
            };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Formatting failed for language {Language}", language);
            return new FormattingResult
            {
                FormattedCode = code,
                Success = false,
                Error = "Le formateur n'est pas installé ou est inaccessible.",
            };
        }
    }

    private static (string? command, string args, bool useStdin) GetFormatterConfig(string language) => language switch
    {
        "python" => ("black", "--quiet -", true),
        "javascript" or "typescript" or "jsx" or "tsx" =>
            ("npx", "prettier --parser babel --write {file}", false),
        "go" => ("gofmt", "", true),
        "rust" => ("rustfmt", "--edition 2021 {file}", false),
        "json" => ("npx", "prettier --parser json --write {file}", false),
        "css" or "scss" => ("npx", "prettier --parser css --write {file}", false),
        "html" => ("npx", "prettier --parser html --write {file}", false),
        _ => (null, string.Empty, false),
    };

    private static string GetExtension(string language) => language switch
    {
        "python" => ".py",
        "javascript" => ".js",
        "typescript" => ".ts",
        "jsx" => ".jsx",
        "tsx" => ".tsx",
        "go" => ".go",
        "rust" => ".rs",
        "json" => ".json",
        "css" => ".css",
        "scss" => ".scss",
        "html" => ".html",
        _ => ".tmp",
    };
}
