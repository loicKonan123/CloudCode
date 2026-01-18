using CloudCode.Application.DTOs.Dependencies;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Diagnostics;
using System.Text;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service de gestion des dépendances avec installation réelle via pip/npm.
/// </summary>
public class DependencyService : IDependencyService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DependencyService> _logger;

    public DependencyService(
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        ILogger<DependencyService> logger)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<DependencyResponseDto> AddAsync(Guid projectId, Guid userId, AddDependencyDto dto, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null || userRole == CollaboratorRole.Read)
                throw new UnauthorizedException("NOT_AUTHORIZED", "Vous n'avez pas les droits pour modifier ce projet.");
        }

        var existing = await _unitOfWork.Dependencies.GetByProjectAndNameAsync(projectId, dto.Name, cancellationToken);
        if (existing != null)
            throw new ConflictException("DEPENDENCY_EXISTS", "Cette dépendance existe déjà dans le projet.");

        var dependencyType = GetDependencyTypeForLanguage(project.Language);

        var dependency = new ProjectDependency
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            Name = dto.Name.Trim(),
            Version = dto.Version?.Trim(),
            Type = dependencyType,
            IsInstalled = false,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Dependencies.AddAsync(dependency, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponseDto(dependency);
    }

    public async Task<ProjectDependenciesDto> GetProjectDependenciesAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (!project.IsPublic && project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null)
                throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
        }

        var dependencies = await _unitOfWork.Dependencies.GetByProjectIdAsync(projectId, cancellationToken);

        return new ProjectDependenciesDto
        {
            ProjectId = projectId,
            DefaultType = GetDependencyTypeForLanguage(project.Language),
            Dependencies = dependencies.Select(MapToResponseDto).ToList()
        };
    }

    public async Task RemoveAsync(Guid projectId, Guid dependencyId, Guid userId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null || userRole == CollaboratorRole.Read)
                throw new UnauthorizedException("NOT_AUTHORIZED", "Vous n'avez pas les droits pour modifier ce projet.");
        }

        var dependency = await _unitOfWork.Dependencies.GetByIdAsync(dependencyId, cancellationToken)
            ?? throw new NotFoundException("DEPENDENCY_NOT_FOUND", "Dépendance non trouvée.");

        if (dependency.ProjectId != projectId)
            throw new NotFoundException("DEPENDENCY_NOT_FOUND", "Dépendance non trouvée dans ce projet.");

        _unitOfWork.Dependencies.Remove(dependency);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<InstallResultDto> InstallDependenciesAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null || userRole == CollaboratorRole.Read)
                throw new UnauthorizedException("NOT_AUTHORIZED", "Vous n'avez pas les droits pour modifier ce projet.");
        }

        var workDir = GetProjectWorkingDirectory(projectId);
        Directory.CreateDirectory(workDir);

        var dependencies = await _unitOfWork.Dependencies.GetByProjectIdAsync(projectId, cancellationToken);
        var result = new InstallResultDto { Success = true };

        if (!dependencies.Any())
        {
            result.Output = "Aucune dépendance à installer.";
            return result;
        }

        var dependencyType = GetDependencyTypeForLanguage(project.Language);

        // Vérifier si le runtime est disponible
        var envStatus = await CheckEnvironmentAsync(cancellationToken);

        try
        {
            if (dependencyType == DependencyType.Pip)
            {
                if (!envStatus.PythonAvailable)
                {
                    result.Success = false;
                    result.Error = "Python n'est pas installé sur le serveur. Contactez l'administrateur.";
                    result.Output = "Erreur: Python non disponible.\n" +
                                   "Pour installer Python sur le serveur:\n" +
                                   "- Windows: téléchargez depuis python.org\n" +
                                   "- Linux: sudo apt install python3 python3-pip python3-venv";
                    return result;
                }
                return await InstallPythonDependenciesAsync(workDir, dependencies.ToList(), cancellationToken);
            }
            else if (dependencyType == DependencyType.Npm)
            {
                if (!envStatus.NodeAvailable || !envStatus.NpmAvailable)
                {
                    result.Success = false;
                    result.Error = "Node.js/npm n'est pas installé sur le serveur. Contactez l'administrateur.";
                    result.Output = "Erreur: Node.js non disponible.\n" +
                                   "Pour installer Node.js sur le serveur:\n" +
                                   "- Windows: téléchargez depuis nodejs.org\n" +
                                   "- Linux: sudo apt install nodejs npm";
                    return result;
                }
                return await InstallNodeDependenciesAsync(workDir, dependencies.ToList(), cancellationToken);
            }
            else
            {
                result.Success = false;
                result.Error = $"Type de dépendance non supporté: {dependencyType}";
                return result;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors de l'installation des dépendances pour le projet {ProjectId}", projectId);
            result.Success = false;
            result.Error = ex.Message;
            return result;
        }
    }

    public async Task<bool> CreatePythonVenvAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null || userRole == CollaboratorRole.Read)
                throw new UnauthorizedException("NOT_AUTHORIZED", "Vous n'avez pas les droits.");
        }

        // Vérifier si Python est disponible
        var envStatus = await CheckEnvironmentAsync(cancellationToken);
        if (!envStatus.PythonAvailable)
        {
            throw new InvalidOperationException("Python n'est pas installé sur le serveur.");
        }

        var workDir = GetProjectWorkingDirectory(projectId);
        Directory.CreateDirectory(workDir);

        var venvPath = Path.Combine(workDir, "venv");
        if (Directory.Exists(venvPath))
        {
            _logger.LogInformation("venv existe déjà pour le projet {ProjectId}", projectId);
            return true;
        }

        var pythonPath = GetPythonPath();
        var (success, _, error) = await RunCommandAsync(pythonPath, "-m venv venv", workDir, cancellationToken);

        if (!success)
        {
            _logger.LogError("Erreur création venv: {Error}", error);
            throw new InvalidOperationException($"Erreur création venv: {error}");
        }

        _logger.LogInformation("venv créé pour le projet {ProjectId}", projectId);
        return true;
    }

    public async Task<bool> InitNodeProjectAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null || userRole == CollaboratorRole.Read)
                throw new UnauthorizedException("NOT_AUTHORIZED", "Vous n'avez pas les droits.");
        }

        // Vérifier si npm est disponible
        var envStatus = await CheckEnvironmentAsync(cancellationToken);
        if (!envStatus.NpmAvailable)
        {
            throw new InvalidOperationException("npm n'est pas installé sur le serveur.");
        }

        var workDir = GetProjectWorkingDirectory(projectId);
        Directory.CreateDirectory(workDir);

        var packageJsonPath = Path.Combine(workDir, "package.json");
        if (File.Exists(packageJsonPath))
        {
            _logger.LogInformation("package.json existe déjà pour le projet {ProjectId}", projectId);
            return true;
        }

        var npmPath = GetNpmPath();
        var (success, _, error) = await RunCommandAsync(npmPath, "init -y", workDir, cancellationToken);

        if (!success)
        {
            _logger.LogError("Erreur npm init: {Error}", error);
            throw new InvalidOperationException($"Erreur npm init: {error}");
        }

        _logger.LogInformation("package.json créé pour le projet {ProjectId}", projectId);
        return true;
    }

    public async Task<EnvironmentStatusDto> CheckEnvironmentAsync(CancellationToken cancellationToken = default)
    {
        var result = new EnvironmentStatusDto
        {
            WorkingDirectory = GetBaseWorkingDirectory()
        };

        // Vérifier Python
        var pythonPath = GetPythonPath();
        var (pythonSuccess, pythonOutput, _) = await RunCommandAsync(pythonPath, "--version", Directory.GetCurrentDirectory(), cancellationToken);
        result.PythonAvailable = pythonSuccess;
        if (pythonSuccess)
        {
            result.PythonVersion = pythonOutput.Trim();
        }

        // Vérifier Node.js
        var nodePath = GetNodePath();
        var (nodeSuccess, nodeOutput, _) = await RunCommandAsync(nodePath, "--version", Directory.GetCurrentDirectory(), cancellationToken);
        result.NodeAvailable = nodeSuccess;
        if (nodeSuccess)
        {
            result.NodeVersion = nodeOutput.Trim();
        }

        // Vérifier npm
        var npmPath = GetNpmPath();
        var (npmSuccess, npmOutput, _) = await RunCommandAsync(npmPath, "--version", Directory.GetCurrentDirectory(), cancellationToken);
        result.NpmAvailable = npmSuccess;
        if (npmSuccess)
        {
            result.NpmVersion = npmOutput.Trim();
        }

        return result;
    }

    #region Private Methods

    private async Task<InstallResultDto> InstallPythonDependenciesAsync(
        string workDir,
        List<ProjectDependency> dependencies,
        CancellationToken cancellationToken)
    {
        var result = new InstallResultDto { Success = true };
        var output = new StringBuilder();

        var pythonPath = GetPythonPath();

        // Vérifier/créer le venv
        var venvPath = Path.Combine(workDir, "venv");
        if (!Directory.Exists(venvPath))
        {
            output.AppendLine("Création de l'environnement virtuel Python...");
            var (venvSuccess, venvOutput, venvError) = await RunCommandAsync(pythonPath, "-m venv venv", workDir, cancellationToken);

            if (!venvSuccess)
            {
                result.Success = false;
                result.Error = $"Erreur création venv: {venvError}";
                result.Output = output.ToString();
                return result;
            }
            output.AppendLine("venv créé avec succès.");
        }
        else
        {
            output.AppendLine("Utilisation du venv existant.");
        }

        // Chemin vers pip dans le venv
        var pipPath = Path.Combine(venvPath, "Scripts", "pip.exe");
        if (!File.Exists(pipPath))
        {
            pipPath = Path.Combine(venvPath, "bin", "pip"); // Linux/Mac
        }

        if (!File.Exists(pipPath))
        {
            result.Success = false;
            result.Error = "pip introuvable dans le venv. Le venv est peut-être corrompu.";
            result.Output = output.ToString();
            return result;
        }

        output.AppendLine($"Utilisation de pip: {pipPath}");
        output.AppendLine();

        // Installer chaque dépendance
        foreach (var dep in dependencies)
        {
            var packageSpec = string.IsNullOrEmpty(dep.Version) ? dep.Name : $"{dep.Name}=={dep.Version}";
            output.AppendLine($"Installation de {packageSpec}...");

            var (success, cmdOutput, cmdError) = await RunCommandAsync(pipPath, $"install {packageSpec}", workDir, cancellationToken);

            var status = new DependencyInstallStatus
            {
                Name = dep.Name,
                Version = dep.Version,
                Installed = success
            };

            if (success)
            {
                output.AppendLine($"✓ {dep.Name} installé avec succès");
                dep.IsInstalled = true;
                dep.InstalledAt = DateTime.UtcNow;
                _unitOfWork.Dependencies.Update(dep);
                result.InstalledCount++;
            }
            else
            {
                var errorMsg = !string.IsNullOrEmpty(cmdError) ? cmdError : "Erreur inconnue";
                output.AppendLine($"✗ {dep.Name}: {errorMsg}");
                status.Error = errorMsg;
                result.FailedCount++;
                result.Success = false;
            }

            result.Dependencies.Add(status);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        result.Output = output.ToString();
        return result;
    }

    private async Task<InstallResultDto> InstallNodeDependenciesAsync(
        string workDir,
        List<ProjectDependency> dependencies,
        CancellationToken cancellationToken)
    {
        var result = new InstallResultDto { Success = true };
        var output = new StringBuilder();

        var npmPath = GetNpmPath();

        // Vérifier/créer package.json
        var packageJsonPath = Path.Combine(workDir, "package.json");
        if (!File.Exists(packageJsonPath))
        {
            output.AppendLine("Initialisation du projet Node.js...");
            var (initSuccess, _, initError) = await RunCommandAsync(npmPath, "init -y", workDir, cancellationToken);

            if (!initSuccess)
            {
                result.Success = false;
                result.Error = $"Erreur npm init: {initError}";
                result.Output = output.ToString();
                return result;
            }
            output.AppendLine("package.json créé.");
        }
        else
        {
            output.AppendLine("Utilisation du package.json existant.");
        }

        output.AppendLine($"Utilisation de npm: {npmPath}");
        output.AppendLine();

        // Installer chaque dépendance
        foreach (var dep in dependencies)
        {
            var packageSpec = string.IsNullOrEmpty(dep.Version) ? dep.Name : $"{dep.Name}@{dep.Version}";
            output.AppendLine($"Installation de {packageSpec}...");

            var (success, cmdOutput, cmdError) = await RunCommandAsync(npmPath, $"install {packageSpec}", workDir, cancellationToken);

            var status = new DependencyInstallStatus
            {
                Name = dep.Name,
                Version = dep.Version,
                Installed = success
            };

            if (success)
            {
                output.AppendLine($"✓ {dep.Name} installé avec succès");
                dep.IsInstalled = true;
                dep.InstalledAt = DateTime.UtcNow;
                _unitOfWork.Dependencies.Update(dep);
                result.InstalledCount++;
            }
            else
            {
                var errorMsg = !string.IsNullOrEmpty(cmdError) ? cmdError : "Erreur inconnue";
                output.AppendLine($"✗ {dep.Name}: {errorMsg}");
                status.Error = errorMsg;
                result.FailedCount++;
                result.Success = false;
            }

            result.Dependencies.Add(status);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        result.Output = output.ToString();
        return result;
    }

    private async Task<(bool success, string output, string error)> RunCommandAsync(
        string command,
        string arguments,
        string workingDirectory,
        CancellationToken cancellationToken)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = command,
                Arguments = arguments,
                WorkingDirectory = workingDirectory,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = psi };
            var outputBuilder = new StringBuilder();
            var errorBuilder = new StringBuilder();

            process.OutputDataReceived += (s, e) => { if (e.Data != null) outputBuilder.AppendLine(e.Data); };
            process.ErrorDataReceived += (s, e) => { if (e.Data != null) errorBuilder.AppendLine(e.Data); };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            // Timeout de 5 minutes
            var completed = await Task.Run(() => process.WaitForExit(300000), cancellationToken);

            if (!completed)
            {
                process.Kill(true);
                return (false, "", "Timeout: la commande a pris trop de temps (5 min max).");
            }

            var output = outputBuilder.ToString();
            var error = errorBuilder.ToString();

            return (process.ExitCode == 0, output, error);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur exécution commande: {Command} {Arguments}", command, arguments);
            return (false, "", ex.Message);
        }
    }

    private string GetBaseWorkingDirectory()
    {
        var configuredDir = _configuration.GetValue<string>("Terminal:WorkingDirectory");
        if (!string.IsNullOrEmpty(configuredDir))
            return configuredDir;

        return Path.Combine(Path.GetTempPath(), "cloudcode_projects");
    }

    private string GetProjectWorkingDirectory(Guid projectId)
    {
        return Path.Combine(GetBaseWorkingDirectory(), projectId.ToString());
    }

    private string GetPythonPath()
    {
        return _configuration.GetValue<string>("Terminal:PythonPath") ?? "python";
    }

    private string GetNodePath()
    {
        return _configuration.GetValue<string>("Terminal:NodePath") ?? "node";
    }

    private string GetNpmPath()
    {
        return _configuration.GetValue<string>("Terminal:NpmPath") ?? "npm";
    }

    private static DependencyType GetDependencyTypeForLanguage(ProgrammingLanguage language)
    {
        return language switch
        {
            ProgrammingLanguage.Python => DependencyType.Pip,
            ProgrammingLanguage.JavaScript => DependencyType.Npm,
            ProgrammingLanguage.TypeScript => DependencyType.Npm,
            ProgrammingLanguage.Rust => DependencyType.Cargo,
            ProgrammingLanguage.Go => DependencyType.Go,
            _ => DependencyType.Pip
        };
    }

    private static DependencyResponseDto MapToResponseDto(ProjectDependency dependency)
    {
        return new DependencyResponseDto
        {
            Id = dependency.Id,
            Name = dependency.Name,
            Version = dependency.Version,
            Type = dependency.Type,
            IsInstalled = dependency.IsInstalled,
            InstalledAt = dependency.InstalledAt,
            CreatedAt = dependency.CreatedAt
        };
    }

    #endregion

    public async Task<ProjectEnvironmentDto> GetProjectEnvironmentAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (!project.IsPublic && project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null)
                throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
        }

        var workDir = GetProjectWorkingDirectory(projectId);
        var result = new ProjectEnvironmentDto
        {
            ProjectId = projectId,
            WorkingDirectory = workDir
        };

        if (!Directory.Exists(workDir))
        {
            return result;
        }

        // Check for Python venv
        var venvPath = Path.Combine(workDir, "venv");
        if (Directory.Exists(venvPath))
        {
            result.HasVenv = true;
            result.VenvPath = venvPath;

            // Get installed packages from site-packages
            var sitePackagesPath = Path.Combine(venvPath, "Lib", "site-packages");
            if (!Directory.Exists(sitePackagesPath))
            {
                sitePackagesPath = Path.Combine(venvPath, "lib", "python3.12", "site-packages"); // Linux
            }

            if (Directory.Exists(sitePackagesPath))
            {
                var packages = Directory.GetDirectories(sitePackagesPath)
                    .Select(d => Path.GetFileName(d))
                    .Where(name => !name.StartsWith("_") && !name.EndsWith(".dist-info") && !name.EndsWith(".egg-info") && name != "__pycache__")
                    .OrderBy(n => n)
                    .Take(50)
                    .ToList();
                result.InstalledPackages = packages;
            }

            // Calculate size and file count
            try
            {
                var dirInfo = new DirectoryInfo(venvPath);
                result.FileCount = dirInfo.GetFiles("*", SearchOption.AllDirectories).Length;
                result.TotalSizeBytes = dirInfo.GetFiles("*", SearchOption.AllDirectories).Sum(f => f.Length);
            }
            catch
            {
                // Ignore errors
            }
        }

        // Check for Node.js node_modules
        var nodeModulesPath = Path.Combine(workDir, "node_modules");
        if (Directory.Exists(nodeModulesPath))
        {
            result.HasNodeModules = true;
            result.NodeModulesPath = nodeModulesPath;

            // Get installed packages
            var packages = Directory.GetDirectories(nodeModulesPath)
                .Select(d => Path.GetFileName(d))
                .Where(name => !name.StartsWith("."))
                .OrderBy(n => n)
                .Take(50)
                .ToList();
            result.InstalledPackages = packages;

            // Calculate size and file count
            try
            {
                var dirInfo = new DirectoryInfo(nodeModulesPath);
                result.FileCount = dirInfo.GetFiles("*", SearchOption.AllDirectories).Length;
                result.TotalSizeBytes = dirInfo.GetFiles("*", SearchOption.AllDirectories).Sum(f => f.Length);
            }
            catch
            {
                // Ignore errors
            }
        }

        // Check for package.json
        result.HasPackageJson = File.Exists(Path.Combine(workDir, "package.json"));

        return result;
    }
}
