namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service de hashage de mots de passe avec BCrypt.
/// </summary>
public class PasswordHasher
{
    private const int WorkFactor = 12; // Coût du hashage (plus élevé = plus sécurisé mais plus lent)

    /// <summary>
    /// Hash un mot de passe en clair.
    /// </summary>
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);
    }

    /// <summary>
    /// Vérifie si un mot de passe correspond au hash.
    /// </summary>
    public bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}
