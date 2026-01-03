using CloudCode.Application.DTOs.Auth;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using Microsoft.Extensions.Configuration;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service d'authentification - gestion des inscriptions, connexions et tokens.
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly PasswordHasher _passwordHasher;
    private readonly int _refreshTokenExpiryDays;

    public AuthService(
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        PasswordHasher passwordHasher,
        IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _refreshTokenExpiryDays = int.Parse(configuration["Jwt:RefreshTokenExpiryDays"] ?? "7");
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto, CancellationToken cancellationToken = default)
    {
        // Vérifier si l'email existe déjà
        var existingByEmail = await _unitOfWork.Users.GetByEmailAsync(dto.Email, cancellationToken);
        if (existingByEmail != null)
        {
            throw new ConflictException("EMAIL_EXISTS", "Un compte avec cet email existe déjà.");
        }

        // Vérifier si le username existe déjà
        var existingByUsername = await _unitOfWork.Users.GetByUsernameAsync(dto.Username, cancellationToken);
        if (existingByUsername != null)
        {
            throw new ConflictException("USERNAME_EXISTS", "Ce nom d'utilisateur est déjà pris.");
        }

        // Créer l'utilisateur
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = dto.Email.ToLowerInvariant(),
            Username = dto.Username,
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            EmailConfirmed = false, // TODO: Implémenter la confirmation par email
            CreatedAt = DateTime.UtcNow
        };

        // Générer les tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays);

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = _tokenService.GetAccessTokenExpiry(),
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Avatar = user.Avatar
            }
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken cancellationToken = default)
    {
        // Rechercher l'utilisateur par email
        var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email.ToLowerInvariant(), cancellationToken);
        if (user == null)
        {
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Email ou mot de passe incorrect.");
        }

        // Vérifier le mot de passe
        if (!_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("INVALID_CREDENTIALS", "Email ou mot de passe incorrect.");
        }

        // Générer les tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        // Mettre à jour le refresh token
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays);
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = _tokenService.GetAccessTokenExpiry(),
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Avatar = user.Avatar
            }
        };
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        // Rechercher l'utilisateur avec ce refresh token
        var user = await _unitOfWork.Users.GetByRefreshTokenAsync(refreshToken, cancellationToken);
        if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
        {
            throw new UnauthorizedException("INVALID_REFRESH_TOKEN", "Token de rafraîchissement invalide ou expiré.");
        }

        // Générer de nouveaux tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        // Rotation du refresh token
        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(_refreshTokenExpiryDays);
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = _tokenService.GetAccessTokenExpiry(),
            User = new UserInfoDto
            {
                Id = user.Id,
                Email = user.Email,
                Username = user.Username,
                Avatar = user.Avatar
            }
        };
    }

    public async Task LogoutAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user != null)
        {
            // Invalider le refresh token
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            user.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public Task<bool> ValidateEmailAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        // TODO: Implémenter la validation par email
        throw new NotImplementedException("Email validation not implemented yet.");
    }

    public Task ForgotPasswordAsync(ForgotPasswordDto dto, CancellationToken cancellationToken = default)
    {
        // TODO: Implémenter l'envoi d'email de réinitialisation
        throw new NotImplementedException("Forgot password not implemented yet.");
    }

    public Task ResetPasswordAsync(ResetPasswordDto dto, CancellationToken cancellationToken = default)
    {
        // TODO: Implémenter la réinitialisation de mot de passe
        throw new NotImplementedException("Reset password not implemented yet.");
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto dto, CancellationToken cancellationToken = default)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new NotFoundException("USER_NOT_FOUND", "Utilisateur non trouvé.");
        }

        // Vérifier l'ancien mot de passe
        if (!_passwordHasher.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedException("INVALID_PASSWORD", "Mot de passe actuel incorrect.");
        }

        // Mettre à jour le mot de passe
        user.PasswordHash = _passwordHasher.HashPassword(dto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        // Invalider le refresh token pour forcer une reconnexion sur les autres appareils
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();
    }
}
