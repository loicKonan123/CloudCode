namespace CloudCode.Domain.Enums;

/// <summary>
/// Types de gestionnaires de packages supportés.
/// </summary>
public enum DependencyType
{
    Pip = 1,      // Python (pip install)
    Npm = 2,      // JavaScript/TypeScript (npm install)
    Cargo = 3,    // Rust (cargo add)
    Go = 4,       // Go modules (go get)
}
