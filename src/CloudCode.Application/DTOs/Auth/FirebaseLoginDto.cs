namespace CloudCode.Application.DTOs.Auth;

public class FirebaseLoginDto
{
    public string FirebaseToken { get; set; } = string.Empty;
    /// <summary>Requis uniquement lors de la première connexion (création du compte).</summary>
    public string? Username { get; set; }
}
