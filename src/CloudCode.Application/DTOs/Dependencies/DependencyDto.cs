using CloudCode.Domain.Enums;

namespace CloudCode.Application.DTOs.Dependencies;

/// <summary>
/// DTO pour ajouter une dépendance.
/// </summary>
public class AddDependencyDto
{
    public string Name { get; set; } = string.Empty;
    public string? Version { get; set; }
}

/// <summary>
/// DTO de réponse pour une dépendance.
/// </summary>
public class DependencyResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Version { get; set; }
    public DependencyType Type { get; set; }
    public bool IsInstalled { get; set; }
    public DateTime? InstalledAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// DTO pour la liste des dépendances d'un projet.
/// </summary>
public class ProjectDependenciesDto
{
    public Guid ProjectId { get; set; }
    public DependencyType DefaultType { get; set; }
    public List<DependencyResponseDto> Dependencies { get; set; } = new();
}

/// <summary>
/// DTO pour le résultat d'une installation de dépendances.
/// </summary>
public class InstallResultDto
{
    public bool Success { get; set; }
    public string Output { get; set; } = string.Empty;
    public string? Error { get; set; }
    public int InstalledCount { get; set; }
    public int FailedCount { get; set; }
    public List<DependencyInstallStatus> Dependencies { get; set; } = new();
}

/// <summary>
/// Statut d'installation d'une dépendance individuelle.
/// </summary>
public class DependencyInstallStatus
{
    public string Name { get; set; } = string.Empty;
    public string? Version { get; set; }
    public bool Installed { get; set; }
    public string? Error { get; set; }
}

/// <summary>
/// Statut de l'environnement serveur.
/// </summary>
public class EnvironmentStatusDto
{
    public bool PythonAvailable { get; set; }
    public string? PythonVersion { get; set; }
    public bool NodeAvailable { get; set; }
    public string? NodeVersion { get; set; }
    public bool NpmAvailable { get; set; }
    public string? NpmVersion { get; set; }
    public string WorkingDirectory { get; set; } = string.Empty;
}

/// <summary>
/// Informations sur l'environnement d'un projet.
/// </summary>
public class ProjectEnvironmentDto
{
    public Guid ProjectId { get; set; }
    public string WorkingDirectory { get; set; } = string.Empty;
    public bool HasVenv { get; set; }
    public string? VenvPath { get; set; }
    public bool HasNodeModules { get; set; }
    public string? NodeModulesPath { get; set; }
    public bool HasPackageJson { get; set; }
    public List<string> InstalledPackages { get; set; } = new();
    public long TotalSizeBytes { get; set; }
    public int FileCount { get; set; }
}
