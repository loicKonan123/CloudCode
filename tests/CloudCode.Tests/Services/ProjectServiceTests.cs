using CloudCode.Application.DTOs.Projects;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Services;
using FluentAssertions;
using Moq;

namespace CloudCode.Tests.Services;

/// <summary>
/// Tests unitaires pour ProjectService.
///
/// CONCEPTS CLÉS :
/// 1. Test des opérations CRUD
/// 2. Test des autorisations (accès projet)
/// 3. Vérification des relations (Owner, Collaborators)
/// </summary>
public class ProjectServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IProjectRepository> _projectRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ICollaborationRepository> _collaborationRepositoryMock;
    private readonly Mock<ICodeFileRepository> _codeFileRepositoryMock;
    private readonly ProjectService _projectService;

    public ProjectServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _projectRepositoryMock = new Mock<IProjectRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _collaborationRepositoryMock = new Mock<ICollaborationRepository>();
        _codeFileRepositoryMock = new Mock<ICodeFileRepository>();

        // Configurer UnitOfWork
        _unitOfWorkMock.Setup(u => u.Projects).Returns(_projectRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.Collaborations).Returns(_collaborationRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.Files).Returns(_codeFileRepositoryMock.Object);

        _projectService = new ProjectService(_unitOfWorkMock.Object);
    }

    #region GetByIdAsync Tests

    /// <summary>
    /// Test : Récupérer un projet existant en tant que propriétaire.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_AsOwner_ShouldReturnProject()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var owner = new User
        {
            Id = ownerId,
            Email = "owner@example.com",
            Username = "owner"
        };

        var project = new Project
        {
            Id = projectId,
            Name = "Mon Projet",
            Description = "Description",
            Language = ProgrammingLanguage.JavaScript,
            IsPublic = false,
            OwnerId = ownerId,
            Owner = owner
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdWithOwnerAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // ===== ACT =====
        var result = await _projectService.GetByIdAsync(projectId, ownerId);

        // ===== ASSERT =====
        result.Should().NotBeNull();
        result.Id.Should().Be(projectId);
        result.Name.Should().Be("Mon Projet");
        result.Owner.Should().NotBeNull();
        result.Owner.Username.Should().Be("owner");
    }

    /// <summary>
    /// Test : Récupérer un projet public sans être connecté.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_PublicProject_WithoutAuth_ShouldReturnProject()
    {
        // ===== ARRANGE =====
        var projectId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            Name = "Projet Public",
            IsPublic = true,  // PUBLIC
            OwnerId = ownerId,
            Owner = new User { Id = ownerId, Username = "someone" }
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdWithOwnerAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // ===== ACT =====
        // userId = null (pas connecté)
        var result = await _projectService.GetByIdAsync(projectId, userId: null);

        // ===== ASSERT =====
        result.Should().NotBeNull();
        result.IsPublic.Should().BeTrue();
    }

    /// <summary>
    /// Test : Accéder à un projet privé sans autorisation.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_PrivateProject_NotOwnerNotCollaborator_ShouldThrow()
    {
        // ===== ARRANGE =====
        var projectId = Guid.NewGuid();
        var ownerId = Guid.NewGuid();
        var requesterId = Guid.NewGuid();  // Quelqu'un d'autre

        var project = new Project
        {
            Id = projectId,
            Name = "Projet Privé",
            IsPublic = false,  // PRIVÉ
            OwnerId = ownerId,
            Owner = new User { Id = ownerId, Username = "owner" }
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdWithOwnerAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // Le requester n'est pas collaborateur
        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, requesterId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Collaboration?)null);

        // ===== ACT & ASSERT =====
        var act = () => _projectService.GetByIdAsync(projectId, requesterId);

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "ACCESS_DENIED");
    }

    /// <summary>
    /// Test : Projet non trouvé.
    /// </summary>
    [Fact]
    public async Task GetByIdAsync_ProjectNotFound_ShouldThrowNotFoundException()
    {
        // ===== ARRANGE =====
        var projectId = Guid.NewGuid();

        _projectRepositoryMock
            .Setup(r => r.GetByIdWithOwnerAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Project?)null);

        // ===== ACT & ASSERT =====
        var act = () => _projectService.GetByIdAsync(projectId, Guid.NewGuid());

        await act.Should()
            .ThrowAsync<NotFoundException>()
            .Where(e => e.Code == "PROJECT_NOT_FOUND");
    }

    #endregion

    #region CreateAsync Tests

    /// <summary>
    /// Test : Créer un projet avec succès.
    /// </summary>
    [Fact]
    public async Task CreateAsync_WithValidData_ShouldCreateAndReturnProject()
    {
        // ===== ARRANGE =====
        var userId = Guid.NewGuid();
        var user = new User
        {
            Id = userId,
            Email = "creator@example.com",
            Username = "creator"
        };

        var createDto = new CreateProjectDto
        {
            Name = "Nouveau Projet",
            Description = "Un super projet",
            Language = ProgrammingLanguage.Python,
            IsPublic = true,
            Tags = new List<string> { "python", "demo" }
        };

        _userRepositoryMock
            .Setup(r => r.GetByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _projectRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Project>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Project p, CancellationToken _) =>
            {
                p.Owner = user;
                return p;
            });

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        var result = await _projectService.CreateAsync(userId, createDto);

        // ===== ASSERT =====
        result.Should().NotBeNull();
        result.Name.Should().Be(createDto.Name);
        result.Description.Should().Be(createDto.Description);
        result.Language.Should().Be(ProgrammingLanguage.Python);
        result.IsPublic.Should().BeTrue();
        result.Tags.Should().Contain("python");
        result.Owner.Username.Should().Be("creator");

        // Vérifier les appels
        _projectRepositoryMock.Verify(
            r => r.AddAsync(It.Is<Project>(p =>
                p.Name == createDto.Name &&
                p.OwnerId == userId),
                It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    #endregion

    #region UpdateAsync Tests

    /// <summary>
    /// Test : Modifier un projet en tant que propriétaire.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_AsOwner_ShouldUpdateProject()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var existingProject = new Project
        {
            Id = projectId,
            Name = "Ancien Nom",
            Description = "Ancienne description",
            IsPublic = false,
            OwnerId = ownerId,
            Owner = new User { Id = ownerId, Username = "owner" }
        };

        var updateDto = new UpdateProjectDto
        {
            Name = "Nouveau Nom",
            IsPublic = true
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingProject);

        _projectRepositoryMock
            .Setup(r => r.GetByIdWithOwnerAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingProject);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        var result = await _projectService.UpdateAsync(projectId, ownerId, updateDto);

        // ===== ASSERT =====
        result.Name.Should().Be("Nouveau Nom");
        result.IsPublic.Should().BeTrue();
        // Description non modifiée
        result.Description.Should().Be("Ancienne description");
    }

    /// <summary>
    /// Test : Un non-propriétaire ne peut pas modifier le projet.
    /// </summary>
    [Fact]
    public async Task UpdateAsync_NotOwner_ShouldThrowUnauthorizedException()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var notOwnerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var existingProject = new Project
        {
            Id = projectId,
            Name = "Projet",
            OwnerId = ownerId,  // Propriétaire différent
            Owner = new User { Id = ownerId }
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdWithOwnerAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingProject);

        // ===== ACT & ASSERT =====
        var act = () => _projectService.UpdateAsync(projectId, notOwnerId, new UpdateProjectDto());

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "NOT_OWNER");
    }

    #endregion

    #region DeleteAsync Tests

    /// <summary>
    /// Test : Supprimer un projet en tant que propriétaire.
    /// </summary>
    [Fact]
    public async Task DeleteAsync_AsOwner_ShouldDeleteProject()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var existingProject = new Project
        {
            Id = projectId,
            OwnerId = ownerId
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingProject);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        await _projectService.DeleteAsync(projectId, ownerId);

        // ===== ASSERT =====
        _projectRepositoryMock.Verify(
            r => r.Remove(existingProject),
            Times.Once,
            "Remove doit être appelé"
        );

        _unitOfWorkMock.Verify(
            u => u.SaveChangesAsync(It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    #endregion

    #region UserHasAccessAsync Tests

    /// <summary>
    /// Test : Le propriétaire a accès.
    /// </summary>
    [Fact]
    public async Task UserHasAccessAsync_AsOwner_ShouldReturnTrue()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = ownerId,
            IsPublic = false
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // ===== ACT =====
        var result = await _projectService.UserHasAccessAsync(projectId, ownerId);

        // ===== ASSERT =====
        result.Should().BeTrue();
    }

    /// <summary>
    /// Test : Un projet public est accessible à tous.
    /// </summary>
    [Fact]
    public async Task UserHasAccessAsync_PublicProject_ShouldReturnTrue()
    {
        // ===== ARRANGE =====
        var projectId = Guid.NewGuid();
        var randomUserId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = Guid.NewGuid(),
            IsPublic = true  // PUBLIC
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // ===== ACT =====
        var result = await _projectService.UserHasAccessAsync(projectId, randomUserId);

        // ===== ASSERT =====
        result.Should().BeTrue();
    }

    /// <summary>
    /// Test : Un collaborateur accepté a accès.
    /// </summary>
    [Fact]
    public async Task UserHasAccessAsync_AsCollaborator_ShouldReturnTrue()
    {
        // ===== ARRANGE =====
        var projectId = Guid.NewGuid();
        var collaboratorId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = Guid.NewGuid(),
            IsPublic = false
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // C'est un collaborateur avec le rôle Write
        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, collaboratorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Collaboration { ProjectId = projectId, UserId = collaboratorId, Role = CollaboratorRole.Write });

        // ===== ACT =====
        var result = await _projectService.UserHasAccessAsync(projectId, collaboratorId);

        // ===== ASSERT =====
        result.Should().BeTrue();
    }

    /// <summary>
    /// Test : Un utilisateur sans droits n'a pas accès.
    /// </summary>
    [Fact]
    public async Task UserHasAccessAsync_NoAccess_ShouldReturnFalse()
    {
        // ===== ARRANGE =====
        var projectId = Guid.NewGuid();
        var randomUserId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = Guid.NewGuid(),
            IsPublic = false
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // Pas collaborateur
        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, randomUserId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Collaboration?)null);

        // ===== ACT =====
        var result = await _projectService.UserHasAccessAsync(projectId, randomUserId);

        // ===== ASSERT =====
        result.Should().BeFalse();
    }

    #endregion
}
