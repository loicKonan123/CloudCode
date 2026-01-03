namespace CloudCode.Application.DTOs.Auth;

/// <summary>
/// DTO pour le rafraîchissement du token JWT.
/// </summary>
public class RefreshTokenDto
{
    public string RefreshToken { get; set; } = string.Empty;
}
