using AutoMapper;
using CloudCode.Application.DTOs.Auth;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur d'authentification (inscription, connexion, tokens).
/// </summary>
public class AuthController : BaseApiController
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITokenService _tokenService;
    private readonly PasswordHasher _passwordHasher;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;

    public AuthController(
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        PasswordHasher passwordHasher,
        IMapper mapper,
        IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _mapper = mapper;
        _configuration = configuration;
    }

    /// <summary>
    /// Inscription d'un nouvel utilisateur.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        // Vérifier si l'email existe déjà
        if (await _unitOfWork.Users.EmailExistsAsync(dto.Email))
        {
            return Conflict(new { message = "Cet email est déjà utilisé" });
        }

        // Vérifier si le username existe déjà
        if (await _unitOfWork.Users.UsernameExistsAsync(dto.Username))
        {
            return Conflict(new { message = "Ce nom d'utilisateur est déjà pris" });
        }

        // Créer l'utilisateur
        var user = new User
        {
            Email = dto.Email.ToLower().Trim(),
            Username = dto.Username.Trim(),
            PasswordHash = _passwordHasher.HashPassword(dto.Password),
            EmailConfirmed = false // TODO: Envoyer email de confirmation
        };

        // Générer les tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7"));

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = _tokenService.GetAccessTokenExpiry(),
            User = _mapper.Map<UserInfoDto>(user)
        });
    }

    /// <summary>
    /// Connexion d'un utilisateur.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email.ToLower().Trim());

        if (user == null || !_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Email ou mot de passe incorrect" });
        }

        // Générer les tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7"));

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = _tokenService.GetAccessTokenExpiry(),
            User = _mapper.Map<UserInfoDto>(user)
        });
    }

    /// <summary>
    /// Rafraîchir le token d'accès.
    /// </summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        var user = await _unitOfWork.Users.GetByRefreshTokenAsync(dto.RefreshToken);

        if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
        {
            return Unauthorized(new { message = "Token de rafraîchissement invalide ou expiré" });
        }

        // Générer de nouveaux tokens
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7"));

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = _tokenService.GetAccessTokenExpiry(),
            User = _mapper.Map<UserInfoDto>(user)
        });
    }

    /// <summary>
    /// Déconnexion (invalidation du refresh token).
    /// </summary>
    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> Logout()
    {
        var userId = GetRequiredUserId();
        var user = await _unitOfWork.Users.GetByIdAsync(userId);

        if (user != null)
        {
            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();
        }

        return Ok(new { message = "Déconnexion réussie" });
    }

    /// <summary>
    /// Récupérer le profil de l'utilisateur connecté.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(UserInfoDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserInfoDto>> GetCurrentUser()
    {
        var userId = GetRequiredUserId();
        var user = await _unitOfWork.Users.GetByIdAsync(userId);

        if (user == null)
        {
            return NotFound();
        }

        return Ok(_mapper.Map<UserInfoDto>(user));
    }

    /// <summary>
    /// Changer le mot de passe.
    /// </summary>
    [Authorize]
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = GetRequiredUserId();
        var user = await _unitOfWork.Users.GetByIdAsync(userId);

        if (user == null)
        {
            return NotFound();
        }

        if (!_passwordHasher.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
        {
            return BadRequest(new { message = "Mot de passe actuel incorrect" });
        }

        user.PasswordHash = _passwordHasher.HashPassword(dto.NewPassword);
        user.RefreshToken = null; // Invalider les sessions existantes
        user.RefreshTokenExpiry = null;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Mot de passe modifié avec succès" });
    }
}
