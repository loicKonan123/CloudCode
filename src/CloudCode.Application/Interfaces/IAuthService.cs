using CloudCode.Application.DTOs.Auth;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service d'authentification et de gestion des tokens.
/// </summary>
public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task LogoutAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> ValidateEmailAsync(string email, string token, CancellationToken cancellationToken = default);
    Task ForgotPasswordAsync(ForgotPasswordDto dto, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordDto dto, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto, CancellationToken cancellationToken = default);
}
