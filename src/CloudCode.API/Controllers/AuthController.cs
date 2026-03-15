using AutoMapper;
using CloudCode.Application.DTOs.Auth;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Services;
using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

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
    private readonly IEmailService _emailService;

    public AuthController(
        IUnitOfWork unitOfWork,
        ITokenService tokenService,
        PasswordHasher passwordHasher,
        IMapper mapper,
        IConfiguration configuration,
        IEmailService emailService)
    {
        _unitOfWork = unitOfWork;
        _tokenService = tokenService;
        _passwordHasher = passwordHasher;
        _mapper = mapper;
        _configuration = configuration;
        _emailService = emailService;
    }

    /// <summary>
    /// Inscription d'un nouvel utilisateur.
    /// </summary>
    [HttpPost("register")]
    [EnableRateLimiting("auth-register")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
    {
        Console.WriteLine($"[Auth] Register attempt: email={dto.Email}, username={dto.Username}");

        // Validate password match
        if (dto.Password != dto.ConfirmPassword)
        {
            Console.WriteLine("[Auth] Register REJECTED: passwords do not match");
            return BadRequest(new { message = "Les mots de passe ne correspondent pas." });
        }

        // Vérifier si l'email existe déjà
        if (await _unitOfWork.Users.EmailExistsAsync(dto.Email))
        {
            Console.WriteLine($"[Auth] Register CONFLICT: email {dto.Email} already exists");
            return Conflict(new { message = "Cet email est déjà utilisé" });
        }

        // Vérifier si le username existe déjà
        if (await _unitOfWork.Users.UsernameExistsAsync(dto.Username))
        {
            Console.WriteLine($"[Auth] Register CONFLICT: username {dto.Username} already taken");
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
        Console.WriteLine($"[Auth] Register SUCCESS: user {user.Email} (Id={user.Id})");

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
    [EnableRateLimiting("auth-login")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
    {
        Console.WriteLine($"[Auth] Login attempt: email={dto.Email}");
        var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email.ToLower().Trim());

        if (user == null || !_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
        {
            Console.WriteLine($"[Auth] Login FAILED: invalid credentials for {dto.Email}");
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
        Console.WriteLine($"[Auth] Login SUCCESS: {user.Email} (Id={user.Id})");

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
    [EnableRateLimiting("auth-refresh")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AuthResponseDto>> RefreshToken([FromBody] RefreshTokenDto dto)
    {
        Console.WriteLine("[Auth] Refresh token attempt");
        var user = await _unitOfWork.Users.GetByRefreshTokenAsync(dto.RefreshToken);

        if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
        {
            Console.WriteLine("[Auth] Refresh FAILED: invalid or expired token");
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
        Console.WriteLine($"[Auth] Logout: userId={userId}");
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
        Console.WriteLine($"[Auth] GET /me: userId={userId}");
        var user = await _unitOfWork.Users.GetByIdAsync(userId);

        if (user == null)
        {
            Console.WriteLine($"[Auth] GET /me: user {userId} NOT FOUND");
            return NotFound();
        }

        Console.WriteLine($"[Auth] GET /me: returning {user.Email}");
        return Ok(_mapper.Map<UserInfoDto>(user));
    }

    /// <summary>
    /// Connexion via Firebase (email verification + password reset gérés par Firebase).
    /// Le client envoie le Firebase ID token ; on vérifie et on émet notre JWT custom.
    /// </summary>
    [HttpPost("firebase")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AuthResponseDto>> FirebaseLogin([FromBody] FirebaseLoginDto dto)
    {
        Console.WriteLine("[Auth] Firebase login attempt");
        // 1. Vérifier le token Firebase
        FirebaseToken firebaseToken;
        try
        {
            firebaseToken = await FirebaseAuth.DefaultInstance.VerifyIdTokenAsync(dto.FirebaseToken);
        }
        catch
        {
            Console.WriteLine("[Auth] Firebase login FAILED: invalid token");
            return Unauthorized(new { message = "Firebase token invalide ou expiré" });
        }

        var firebaseUid = firebaseToken.Uid;
        Console.WriteLine($"[Auth] Firebase UID={firebaseUid}");
        var email = firebaseToken.Claims.TryGetValue("email", out var emailClaim)
            ? emailClaim.ToString()!.ToLower().Trim()
            : string.Empty;

        if (string.IsNullOrEmpty(email))
            return BadRequest(new { message = "Email introuvable dans le token Firebase" });

        // 2. Chercher l'utilisateur par FirebaseUid, puis par email (migration comptes existants)
        var user = await _unitOfWork.Users.GetByFirebaseUidAsync(firebaseUid)
                ?? await _unitOfWork.Users.GetByEmailAsync(email);

        var isNewUser = user == null;

        if (isNewUser)
        {
            // Nouveau compte — username obligatoire
            if (string.IsNullOrWhiteSpace(dto.Username))
                return BadRequest(new { message = "Username requis pour créer un compte", needsUsername = true });

            if (await _unitOfWork.Users.UsernameExistsAsync(dto.Username.Trim()))
                return Conflict(new { message = "Ce nom d'utilisateur est déjà pris" });

            user = new User
            {
                Email = email,
                Username = dto.Username.Trim(),
                PasswordHash = string.Empty,
                FirebaseUid = firebaseUid,
                EmailConfirmed = true,
            };
        }
        else if (user!.FirebaseUid != firebaseUid)
        {
            // Lier le compte existant au Firebase UID si ce n'est pas fait
            user.FirebaseUid = firebaseUid;
            user.EmailConfirmed = true;
        }

        // 3. Émettre notre JWT custom
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(
            int.Parse(_configuration["Jwt:RefreshTokenExpiryDays"] ?? "7"));

        if (isNewUser)
            await _unitOfWork.Users.AddAsync(user);
        else
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

    /// <summary>
    /// Demande de reset de mot de passe — génère un token et envoie un email.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-forgot-password")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email.ToLower().Trim());

        // On répond toujours OK pour ne pas révéler si l'email existe
        if (user == null)
            return Ok(new { message = "Si cet email est enregistré, un lien de réinitialisation a été envoyé." });

        var token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        user.PasswordResetToken = token;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        var frontendUrl = _configuration["App:FrontendUrl"] ?? "http://localhost:3000";
        var resetLink = $"{frontendUrl}/reset-password?token={token}";

        await _emailService.SendPasswordResetAsync(user.Email, resetLink);

        return Ok(new { message = "Si cet email est enregistré, un lien de réinitialisation a été envoyé." });
    }

    /// <summary>
    /// Réinitialisation effective du mot de passe via le token reçu par email.
    /// </summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (dto.NewPassword != dto.ConfirmPassword)
            return BadRequest(new { message = "Les mots de passe ne correspondent pas." });

        if (dto.NewPassword.Length < 6)
            return BadRequest(new { message = "Le mot de passe doit faire au moins 6 caractères." });

        var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email.ToLower().Trim());

        if (user == null
            || user.PasswordResetToken != dto.Token
            || user.PasswordResetTokenExpiry == null
            || user.PasswordResetTokenExpiry < DateTime.UtcNow)
        {
            return BadRequest(new { message = "Lien invalide ou expiré." });
        }

        user.PasswordHash = _passwordHasher.HashPassword(dto.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.RefreshToken = null;
        user.RefreshTokenExpiry = null;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return Ok(new { message = "Mot de passe réinitialisé avec succès." });
    }
}
