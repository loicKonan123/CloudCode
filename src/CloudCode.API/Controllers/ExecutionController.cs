using CloudCode.Application.DTOs.Execution;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur d'exécution de code.
/// </summary>
[Authorize]
public class ExecutionController : BaseApiController
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly IDependencyService _dependencyService;

    public ExecutionController(IUnitOfWork unitOfWork, IConfiguration configuration, IDependencyService dependencyService)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _dependencyService = dependencyService;
    }

    /// <summary>
    /// Exécuter du code.
    /// </summary>
    [HttpPost("run")]
    [ProducesResponseType(typeof(ExecutionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ExecutionResultDto>> ExecuteCode([FromBody] ExecuteCodeDto dto)
    {
        var userId = GetRequiredUserId();

        // Vérifier l'accès au projet
        if (!await _unitOfWork.Projects.UserHasAccessAsync(dto.ProjectId, userId))
        {
            return Forbid();
        }

        var timeoutSeconds = _configuration.GetValue<int>("CodeExecution:TimeoutSeconds", 5);
        var maxOutput = _configuration.GetValue<int>("CodeExecution:MaxOutputLength", 50000);

        var stopwatch = Stopwatch.StartNew();
        string output = "";
        string errorOutput = "";
        int exitCode = 0;
        ExecutionStatus status = ExecutionStatus.Completed;

        try
        {
            // Pour Python, s'assurer que le venv existe
            if (dto.Language == ProgrammingLanguage.Python)
            {
                var venvResult = await EnsurePythonVenvAsync(dto.ProjectId, timeoutSeconds);
                if (!venvResult.Success)
                {
                    return Ok(new ExecutionResultDto
                    {
                        Id = Guid.NewGuid(),
                        Output = "",
                        ErrorOutput = $"Erreur lors de la création de l'environnement virtuel:\n{venvResult.Error}",
                        ExitCode = -1,
                        Status = ExecutionStatus.Failed,
                        ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds,
                        ExecutedAt = DateTime.UtcNow
                    });
                }
            }

            // Installer les dépendances avant l'exécution
            var dependencies = await _unitOfWork.Dependencies.GetByProjectIdAsync(dto.ProjectId);
            var dependencyList = dependencies.ToList();

            if (dependencyList.Any())
            {
                var installResult = await InstallDependenciesAsync(dependencyList, dto.Language, timeoutSeconds);
                if (!installResult.Success)
                {
                    return Ok(new ExecutionResultDto
                    {
                        Id = Guid.NewGuid(),
                        Output = "",
                        ErrorOutput = $"Erreur lors de l'installation des dépendances:\n{installResult.Error}",
                        ExitCode = -1,
                        Status = ExecutionStatus.Failed,
                        ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds,
                        ExecutedAt = DateTime.UtcNow
                    });
                }
            }

            var result = await ExecuteCodeInternal(dto.Code, dto.Language, dto.Input, timeoutSeconds, dto.ProjectId);
            output = result.Output;
            errorOutput = result.ErrorOutput;
            exitCode = result.ExitCode;
            status = result.Status;
        }
        catch (TimeoutException)
        {
            status = ExecutionStatus.Timeout;
            errorOutput = $"Execution timed out after {timeoutSeconds} seconds";
            exitCode = -1;
        }
        catch (Exception ex)
        {
            status = ExecutionStatus.Failed;
            errorOutput = $"Execution error: {ex.Message}";
            exitCode = -1;
        }

        stopwatch.Stop();

        // Tronquer la sortie si trop longue
        if (output.Length > maxOutput)
        {
            output = output.Substring(0, maxOutput) + "\n... (output truncated)";
        }
        if (errorOutput.Length > maxOutput)
        {
            errorOutput = errorOutput.Substring(0, maxOutput) + "\n... (output truncated)";
        }

        // Sauvegarder le résultat
        var executionResult = new ExecutionResult
        {
            ProjectId = dto.ProjectId,
            FileId = dto.FileId,
            UserId = userId,
            Language = dto.Language,
            Code = dto.Code,
            Output = output,
            ErrorOutput = errorOutput,
            ExitCode = exitCode,
            Status = status,
            ExecutionTime = stopwatch.Elapsed
        };

        // Note: On ne sauvegarde pas en BDD pour le moment (optionnel)
        // await _unitOfWork.ExecutionResults.AddAsync(executionResult);
        // await _unitOfWork.SaveChangesAsync();

        return Ok(new ExecutionResultDto
        {
            Id = executionResult.Id,
            Output = output,
            ErrorOutput = errorOutput,
            ExitCode = exitCode,
            Status = status,
            ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds,
            ExecutedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Obtenir les langages supportés.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("languages")]
    [ProducesResponseType(typeof(IEnumerable<object>), StatusCodes.Status200OK)]
    public ActionResult GetSupportedLanguages()
    {
        var languages = new[]
        {
            new { Id = (int)ProgrammingLanguage.JavaScript, Name = "JavaScript", Extension = ".js", Command = "node" },
            new { Id = (int)ProgrammingLanguage.Python, Name = "Python", Extension = ".py", Command = "python" },
            new { Id = (int)ProgrammingLanguage.CSharp, Name = "C#", Extension = ".cs", Command = "dotnet script" },
            new { Id = (int)ProgrammingLanguage.TypeScript, Name = "TypeScript", Extension = ".ts", Command = "ts-node" }
        };

        return Ok(languages);
    }

    #region Private Methods

    private async Task<(string Output, string ErrorOutput, int ExitCode, ExecutionStatus Status)> ExecuteCodeInternal(
        string code,
        ProgrammingLanguage language,
        string? input,
        int timeoutSeconds,
        Guid? projectId = null)
    {
        // Déterminer la commande selon le langage
        var (command, args, tempFileExt) = GetExecutionCommand(language, projectId);

        if (string.IsNullOrEmpty(command))
        {
            return ("", $"Language {language} is not supported for execution", -1, ExecutionStatus.Failed);
        }

        // Créer un fichier temporaire dans le répertoire du projet si Python
        var tempDir = language == ProgrammingLanguage.Python && projectId.HasValue
            ? GetProjectWorkingDirectory(projectId.Value)
            : Path.GetTempPath();
        Directory.CreateDirectory(tempDir);

        var tempFile = Path.Combine(tempDir, $"cloudcode_{Guid.NewGuid()}{tempFileExt}");

        try
        {
            await System.IO.File.WriteAllTextAsync(tempFile, code);

            var psi = new ProcessStartInfo
            {
                FileName = command,
                Arguments = args.Replace("{file}", tempFile),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = tempDir
            };

            using var process = new Process { StartInfo = psi };
            var outputBuilder = new System.Text.StringBuilder();
            var errorBuilder = new System.Text.StringBuilder();

            process.OutputDataReceived += (s, e) =>
            {
                if (e.Data != null) outputBuilder.AppendLine(e.Data);
            };
            process.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null) errorBuilder.AppendLine(e.Data);
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            // Envoyer l'input si fourni
            if (!string.IsNullOrEmpty(input))
            {
                await process.StandardInput.WriteAsync(input);
                process.StandardInput.Close();
            }

            // Attendre avec timeout
            var completed = await Task.Run(() => process.WaitForExit(timeoutSeconds * 1000));

            if (!completed)
            {
                process.Kill(true);
                throw new TimeoutException();
            }

            return (
                outputBuilder.ToString().TrimEnd(),
                errorBuilder.ToString().TrimEnd(),
                process.ExitCode,
                process.ExitCode == 0 ? ExecutionStatus.Completed : ExecutionStatus.Failed
            );
        }
        finally
        {
            // Nettoyer le fichier temporaire
            if (System.IO.File.Exists(tempFile))
            {
                try { System.IO.File.Delete(tempFile); } catch { }
            }
        }
    }

    private (string Command, string Args, string Extension) GetExecutionCommand(ProgrammingLanguage language, Guid? projectId = null)
    {
        if (language == ProgrammingLanguage.Python && projectId.HasValue)
        {
            var pythonPath = GetVenvPythonPath(projectId.Value);
            if (!string.IsNullOrEmpty(pythonPath) && System.IO.File.Exists(pythonPath))
            {
                return (pythonPath, "{file}", ".py");
            }
        }

        return language switch
        {
            ProgrammingLanguage.JavaScript => ("node", "{file}", ".js"),
            ProgrammingLanguage.Python => ("python", "{file}", ".py"),
            ProgrammingLanguage.TypeScript => ("npx", "ts-node {file}", ".ts"),
            _ => ("", "", "")
        };
    }

    private async Task<(bool Success, string Error)> InstallDependenciesAsync(
        List<ProjectDependency> dependencies,
        ProgrammingLanguage language,
        int timeoutSeconds)
    {
        // Récupérer le projectId depuis les dépendances
        var projectId = dependencies.FirstOrDefault()?.ProjectId;

        // Pour Python, créer un venv si nécessaire
        if (language == ProgrammingLanguage.Python && projectId.HasValue)
        {
            var venvResult = await EnsurePythonVenvAsync(projectId.Value, timeoutSeconds);
            if (!venvResult.Success)
            {
                return venvResult;
            }
        }

        // Déterminer la commande d'installation selon le langage
        var (installCommand, packageArgs) = GetInstallCommand(language, projectId);

        if (string.IsNullOrEmpty(installCommand))
        {
            return (true, ""); // Pas de gestionnaire de packages pour ce langage
        }

        // Construire la liste des packages à installer
        var packages = dependencies
            .Select(d => string.IsNullOrEmpty(d.Version) ? d.Name : $"{d.Name}=={d.Version}")
            .ToList();

        if (!packages.Any())
        {
            return (true, "");
        }

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = installCommand,
                Arguments = packageArgs.Replace("{packages}", string.Join(" ", packages)),
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            // Définir le répertoire de travail pour Python
            if (language == ProgrammingLanguage.Python && projectId.HasValue)
            {
                psi.WorkingDirectory = GetProjectWorkingDirectory(projectId.Value);
            }

            using var process = new Process { StartInfo = psi };
            var errorBuilder = new System.Text.StringBuilder();

            process.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null) errorBuilder.AppendLine(e.Data);
            };

            process.Start();
            process.BeginErrorReadLine();

            // Timeout plus long pour l'installation (60s par défaut, ou 5x le timeout d'exécution)
            var installTimeout = Math.Max(60, timeoutSeconds * 5);
            var completed = await Task.Run(() => process.WaitForExit(installTimeout * 1000));

            if (!completed)
            {
                process.Kill(true);
                return (false, "Installation timeout - les dépendances n'ont pas pu être installées à temps");
            }

            if (process.ExitCode != 0)
            {
                return (false, errorBuilder.ToString());
            }

            return (true, "");
        }
        catch (Exception ex)
        {
            return (false, ex.Message);
        }
    }

    private (string Command, string Args) GetInstallCommand(ProgrammingLanguage language, Guid? projectId = null)
    {
        if (language == ProgrammingLanguage.Python && projectId.HasValue)
        {
            var pipPath = GetVenvPipPath(projectId.Value);
            if (!string.IsNullOrEmpty(pipPath) && System.IO.File.Exists(pipPath))
            {
                return (pipPath, "install --quiet {packages}");
            }
        }

        return language switch
        {
            ProgrammingLanguage.Python => ("pip", "install --quiet --user {packages}"),
            ProgrammingLanguage.JavaScript => ("npm", "install --silent {packages}"),
            ProgrammingLanguage.TypeScript => ("npm", "install --silent {packages}"),
            _ => ("", "")
        };
    }

    #region Python Venv Methods

    private string GetProjectWorkingDirectory(Guid projectId)
    {
        var baseDir = _configuration.GetValue<string>("CodeExecution:WorkingDirectory")
            ?? Path.Combine(Path.GetTempPath(), "cloudcode_projects");
        return Path.Combine(baseDir, projectId.ToString());
    }

    private string GetVenvPath(Guid projectId)
    {
        return Path.Combine(GetProjectWorkingDirectory(projectId), "venv");
    }

    private string GetVenvPythonPath(Guid projectId)
    {
        var venvPath = GetVenvPath(projectId);
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return Path.Combine(venvPath, "Scripts", "python.exe");
        }
        return Path.Combine(venvPath, "bin", "python");
    }

    private string GetVenvPipPath(Guid projectId)
    {
        var venvPath = GetVenvPath(projectId);
        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            return Path.Combine(venvPath, "Scripts", "pip.exe");
        }
        return Path.Combine(venvPath, "bin", "pip");
    }

    private async Task<(bool Success, string Error)> EnsurePythonVenvAsync(Guid projectId, int timeoutSeconds)
    {
        var venvPath = GetVenvPath(projectId);
        var pythonPath = GetVenvPythonPath(projectId);

        // Vérifier si le venv existe déjà
        if (Directory.Exists(venvPath) && System.IO.File.Exists(pythonPath))
        {
            return (true, "");
        }

        // Créer le répertoire du projet
        var projectDir = GetProjectWorkingDirectory(projectId);
        Directory.CreateDirectory(projectDir);

        try
        {
            // Créer le virtual environment
            var psi = new ProcessStartInfo
            {
                FileName = "python",
                Arguments = $"-m venv \"{venvPath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = projectDir
            };

            using var process = new Process { StartInfo = psi };
            var errorBuilder = new System.Text.StringBuilder();

            process.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null) errorBuilder.AppendLine(e.Data);
            };

            process.Start();
            process.BeginErrorReadLine();

            // Timeout de 60 secondes pour créer le venv
            var completed = await Task.Run(() => process.WaitForExit(60000));

            if (!completed)
            {
                process.Kill(true);
                return (false, "Timeout lors de la création de l'environnement virtuel Python");
            }

            if (process.ExitCode != 0)
            {
                return (false, $"Erreur lors de la création du venv: {errorBuilder}");
            }

            // Vérifier que le venv a été créé correctement
            if (!System.IO.File.Exists(pythonPath))
            {
                return (false, "L'environnement virtuel n'a pas été créé correctement");
            }

            // Mettre à jour pip dans le venv
            var pipPath = GetVenvPipPath(projectId);
            if (System.IO.File.Exists(pipPath))
            {
                var upgradePsi = new ProcessStartInfo
                {
                    FileName = pythonPath,
                    Arguments = "-m pip install --upgrade pip --quiet",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = projectDir
                };

                using var upgradeProcess = new Process { StartInfo = upgradePsi };
                upgradeProcess.Start();
                await Task.Run(() => upgradeProcess.WaitForExit(30000));
            }

            return (true, "");
        }
        catch (Exception ex)
        {
            return (false, $"Erreur lors de la création du venv: {ex.Message}");
        }
    }

    #endregion

    #endregion
}
