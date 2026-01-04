using CloudCode.Application.DTOs.Auth;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;

namespace CloudCode.Tests.Services;

/// <summary>
/// Tests unitaires pour AuthService.
///
/// CONCEPTS CLÉS :
/// 1. Arrange-Act-Assert (AAA) : Structure de chaque test
/// 2. Mocking : Simuler les dépendances (IUnitOfWork, ITokenService)
/// 3. FluentAssertions : Assertions lisibles et expressives
/// </summary>
public class AuthServiceTests
{
    // ===== MOCKS =====
    // Les mocks simulent les dépendances sans utiliser de vraie BDD
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly Mock<IConfiguration> _configurationMock;
    private readonly PasswordHasher _passwordHasher;

    // Le service à tester (SUT = System Under Test)
    private readonly AuthService _authService;

    /// <summary>
    /// Constructeur : Appelé avant CHAQUE test.
    /// Configure les mocks et crée le service à tester.
    /// </summary>
    public AuthServiceTests()
    {
        // Créer les mocks
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _tokenServiceMock = new Mock<ITokenService>();
        _configurationMock = new Mock<IConfiguration>();
        _passwordHasher = new PasswordHasher();

        // Configurer IConfiguration
        _configurationMock.Setup(c => c["Jwt:RefreshTokenExpiryDays"]).Returns("7");

        // Configurer UnitOfWork pour retourner le mock du repository
        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepositoryMock.Object);

        // Créer le service avec les mocks
        _authService = new AuthService(
            _unitOfWorkMock.Object,
            _tokenServiceMock.Object,
            _passwordHasher,
            _configurationMock.Object
        );
    }

    #region Register Tests

    /// <summary>
    /// Test : L'inscription réussit avec des données valides.
    /// </summary>
    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldCreateUserAndReturnTokens()
    {
        // ===== ARRANGE =====
        // Préparer les données de test
        var registerDto = new RegisterDto
        {
            Email = "test@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            Username = "testuser"
        };

        // Configurer les mocks :
        // - L'email n'existe pas encore
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // - Le username n'existe pas
        _userRepositoryMock
            .Setup(r => r.GetByUsernameAsync(registerDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // - AddAsync retourne l'utilisateur créé
        _userRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User u, CancellationToken _) => u);

        // - SaveChanges réussit
        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // - TokenService génère des tokens
        _tokenServiceMock
            .Setup(t => t.GenerateAccessToken(It.IsAny<User>()))
            .Returns("fake-access-token");

        _tokenServiceMock
            .Setup(t => t.GenerateRefreshToken())
            .Returns("fake-refresh-token");

        _tokenServiceMock
            .Setup(t => t.GetAccessTokenExpiry())
            .Returns(DateTime.UtcNow.AddHours(1));

        // ===== ACT =====
        // Exécuter la méthode à tester
        var result = await _authService.RegisterAsync(registerDto);

        // ===== ASSERT =====
        // Vérifier les résultats avec FluentAssertions
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("fake-access-token");
        result.RefreshToken.Should().Be("fake-refresh-token");
        result.User.Should().NotBeNull();
        result.User.Email.Should().Be(registerDto.Email.ToLowerInvariant());
        result.User.Username.Should().Be(registerDto.Username);

        // Vérifier que les méthodes ont été appelées
        _userRepositoryMock.Verify(
            r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
            Times.Once,
            "AddAsync doit être appelé une fois"
        );

        _unitOfWorkMock.Verify(
            u => u.SaveChangesAsync(It.IsAny<CancellationToken>()),
            Times.Once,
            "SaveChangesAsync doit être appelé une fois"
        );
    }

    /// <summary>
    /// Test : L'inscription échoue si l'email existe déjà.
    /// </summary>
    [Fact]
    public async Task RegisterAsync_WithExistingEmail_ShouldThrowConflictException()
    {
        // ===== ARRANGE =====
        var registerDto = new RegisterDto
        {
            Email = "existing@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            Username = "newuser"
        };

        // L'email existe déjà !
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Email = registerDto.Email });

        // ===== ACT & ASSERT =====
        // On s'attend à une exception
        var act = () => _authService.RegisterAsync(registerDto);

        await act.Should()
            .ThrowAsync<ConflictException>()
            .Where(e => e.Code == "EMAIL_EXISTS");

        // Vérifier que AddAsync n'a PAS été appelé
        _userRepositoryMock.Verify(
            r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>()),
            Times.Never,
            "AddAsync ne doit pas être appelé si l'email existe"
        );
    }

    /// <summary>
    /// Test : L'inscription échoue si le username existe déjà.
    /// </summary>
    [Fact]
    public async Task RegisterAsync_WithExistingUsername_ShouldThrowConflictException()
    {
        // ===== ARRANGE =====
        var registerDto = new RegisterDto
        {
            Email = "new@example.com",
            Password = "Password123!",
            ConfirmPassword = "Password123!",
            Username = "existinguser"
        };

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Le username existe déjà !
        _userRepositoryMock
            .Setup(r => r.GetByUsernameAsync(registerDto.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Username = "existinguser" });

        // ===== ACT & ASSERT =====
        var act = () => _authService.RegisterAsync(registerDto);

        await act.Should()
            .ThrowAsync<ConflictException>()
            .Where(e => e.Code == "USERNAME_EXISTS");
    }

    #endregion

    #region Login Tests

    /// <summary>
    /// Test : La connexion réussit avec des identifiants valides.
    /// </summary>
    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldReturnTokens()
    {
        // ===== ARRANGE =====
        var loginDto = new LoginDto
        {
            Email = "user@example.com",
            Password = "CorrectPassword123!"
        };

        // Créer un utilisateur avec le mot de passe hashé
        var hashedPassword = _passwordHasher.HashPassword(loginDto.Password);
        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = loginDto.Email.ToLowerInvariant(),
            Username = "testuser",
            PasswordHash = hashedPassword
        };

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _tokenServiceMock
            .Setup(t => t.GenerateAccessToken(existingUser))
            .Returns("login-access-token");

        _tokenServiceMock
            .Setup(t => t.GenerateRefreshToken())
            .Returns("login-refresh-token");

        _tokenServiceMock
            .Setup(t => t.GetAccessTokenExpiry())
            .Returns(DateTime.UtcNow.AddHours(1));

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        var result = await _authService.LoginAsync(loginDto);

        // ===== ASSERT =====
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("login-access-token");
        result.RefreshToken.Should().Be("login-refresh-token");
        result.User.Id.Should().Be(existingUser.Id);
    }

    /// <summary>
    /// Test : La connexion échoue avec un email inexistant.
    /// </summary>
    [Fact]
    public async Task LoginAsync_WithNonExistentEmail_ShouldThrowUnauthorizedException()
    {
        // ===== ARRANGE =====
        var loginDto = new LoginDto
        {
            Email = "notfound@example.com",
            Password = "SomePassword123!"
        };

        // L'utilisateur n'existe pas
        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // ===== ACT & ASSERT =====
        var act = () => _authService.LoginAsync(loginDto);

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "INVALID_CREDENTIALS");
    }

    /// <summary>
    /// Test : La connexion échoue avec un mauvais mot de passe.
    /// </summary>
    [Fact]
    public async Task LoginAsync_WithWrongPassword_ShouldThrowUnauthorizedException()
    {
        // ===== ARRANGE =====
        var loginDto = new LoginDto
        {
            Email = "user@example.com",
            Password = "WrongPassword!"
        };

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = loginDto.Email.ToLowerInvariant(),
            Username = "testuser",
            PasswordHash = _passwordHasher.HashPassword("CorrectPassword123!")  // Différent !
        };

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // ===== ACT & ASSERT =====
        var act = () => _authService.LoginAsync(loginDto);

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "INVALID_CREDENTIALS");

        // Les tokens ne doivent pas être générés
        _tokenServiceMock.Verify(
            t => t.GenerateAccessToken(It.IsAny<User>()),
            Times.Never
        );
    }

    #endregion

    #region RefreshToken Tests

    /// <summary>
    /// Test : Le rafraîchissement réussit avec un token valide.
    /// </summary>
    [Fact]
    public async Task RefreshTokenAsync_WithValidToken_ShouldReturnNewTokens()
    {
        // ===== ARRANGE =====
        var refreshToken = "valid-refresh-token";

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            Username = "testuser",
            RefreshToken = refreshToken,
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(1)  // Non expiré
        };

        _userRepositoryMock
            .Setup(r => r.GetByRefreshTokenAsync(refreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _tokenServiceMock
            .Setup(t => t.GenerateAccessToken(existingUser))
            .Returns("new-access-token");

        _tokenServiceMock
            .Setup(t => t.GenerateRefreshToken())
            .Returns("new-refresh-token");

        _tokenServiceMock
            .Setup(t => t.GetAccessTokenExpiry())
            .Returns(DateTime.UtcNow.AddHours(1));

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        var result = await _authService.RefreshTokenAsync(refreshToken);

        // ===== ASSERT =====
        result.Should().NotBeNull();
        result.AccessToken.Should().Be("new-access-token");
        result.RefreshToken.Should().Be("new-refresh-token");
    }

    /// <summary>
    /// Test : Le rafraîchissement échoue avec un token expiré.
    /// </summary>
    [Fact]
    public async Task RefreshTokenAsync_WithExpiredToken_ShouldThrowUnauthorizedException()
    {
        // ===== ARRANGE =====
        var refreshToken = "expired-refresh-token";

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "user@example.com",
            RefreshToken = refreshToken,
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(-1)  // EXPIRÉ !
        };

        _userRepositoryMock
            .Setup(r => r.GetByRefreshTokenAsync(refreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        // ===== ACT & ASSERT =====
        var act = () => _authService.RefreshTokenAsync(refreshToken);

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "INVALID_REFRESH_TOKEN");
    }

    /// <summary>
    /// Test : Le rafraîchissement échoue avec un token invalide.
    /// </summary>
    [Fact]
    public async Task RefreshTokenAsync_WithInvalidToken_ShouldThrowUnauthorizedException()
    {
        // ===== ARRANGE =====
        var refreshToken = "non-existent-token";

        _userRepositoryMock
            .Setup(r => r.GetByRefreshTokenAsync(refreshToken, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // ===== ACT & ASSERT =====
        var act = () => _authService.RefreshTokenAsync(refreshToken);

        await act.Should()
            .ThrowAsync<UnauthorizedException>();
    }

    #endregion

    #region Logout Tests

    /// <summary>
    /// Test : La déconnexion supprime le refresh token.
    /// </summary>
    [Fact]
    public async Task LogoutAsync_ShouldClearRefreshToken()
    {
        // ===== ARRANGE =====
        var userId = Guid.NewGuid();
        var existingUser = new User
        {
            Id = userId,
            Email = "user@example.com",
            RefreshToken = "some-refresh-token",
            RefreshTokenExpiry = DateTime.UtcNow.AddDays(7)
        };

        _userRepositoryMock
            .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingUser);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        await _authService.LogoutAsync(userId);

        // ===== ASSERT =====
        existingUser.RefreshToken.Should().BeNull();
        existingUser.RefreshTokenExpiry.Should().BeNull();

        _unitOfWorkMock.Verify(
            u => u.SaveChangesAsync(It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    /// <summary>
    /// Test : La déconnexion ne fait rien si l'utilisateur n'existe pas.
    /// </summary>
    [Fact]
    public async Task LogoutAsync_UserNotFound_ShouldNotThrow()
    {
        // ===== ARRANGE =====
        var userId = Guid.NewGuid();

        _userRepositoryMock
            .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // ===== ACT =====
        var act = () => _authService.LogoutAsync(userId);

        // ===== ASSERT =====
        await act.Should().NotThrowAsync();
    }

    #endregion
}
