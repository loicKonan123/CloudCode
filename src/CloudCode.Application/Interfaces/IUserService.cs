using CloudCode.Application.DTOs.Users;

namespace CloudCode.Application.Interfaces;

/// <summary>
/// Service de gestion des utilisateurs.
/// </summary>
public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileDto dto, CancellationToken cancellationToken = default);
    Task<PublicUserDto?> GetPublicProfileAsync(string username, CancellationToken cancellationToken = default);
    Task<IEnumerable<PublicUserDto>> SearchUsersAsync(string searchTerm, int limit = 10, CancellationToken cancellationToken = default);
    Task DeleteAccountAsync(Guid userId, string password, CancellationToken cancellationToken = default);
}
