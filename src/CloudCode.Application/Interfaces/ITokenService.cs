using CloudCode.Domain.Entities;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service de génération et validation des tokens JWT.
/// </summary>
public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    Task<bool> ValidateAccessTokenAsync(string token);
    Guid? GetUserIdFromToken(string token);
    DateTime GetAccessTokenExpiry();
}
