using CloudCode.Application.DTOs.Collaboration;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Services;
using FluentAssertions;
using Moq;

namespace CloudCode.Tests.Services;

/// <summary>
/// Tests unitaires pour CollaborationService.
///
/// CONCEPTS CLÉS :
/// 1. Tests des invitations et acceptation
/// 2. Tests des autorisations (propriétaire vs admin vs collaborateur)
/// 3. Tests des cas d'erreur (déjà collaborateur, invitation non trouvée)
/// </summary>
public class CollaborationServiceTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;
    private readonly Mock<IProjectRepository> _projectRepositoryMock;
    private readonly Mock<IUserRepository> _userRepositoryMock;
    private readonly Mock<ICollaborationRepository> _collaborationRepositoryMock;
    private readonly CollaborationService _collaborationService;

    public CollaborationServiceTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
        _projectRepositoryMock = new Mock<IProjectRepository>();
        _userRepositoryMock = new Mock<IUserRepository>();
        _collaborationRepositoryMock = new Mock<ICollaborationRepository>();

        // Configurer UnitOfWork
        _unitOfWorkMock.Setup(u => u.Projects).Returns(_projectRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.Users).Returns(_userRepositoryMock.Object);
        _unitOfWorkMock.Setup(u => u.Collaborations).Returns(_collaborationRepositoryMock.Object);

        _collaborationService = new CollaborationService(_unitOfWorkMock.Object);
    }

    #region InviteAsync Tests

    /// <summary>
    /// Test : Le propriétaire peut inviter un collaborateur.
    /// </summary>
    [Fact]
    public async Task InviteAsync_AsOwner_ShouldCreateInvitation()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var inviteeId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            Name = "Mon Projet",
            OwnerId = ownerId
        };

        var userToInvite = new User
        {
            Id = inviteeId,
            Email = "invitee@example.com",
            Username = "invitee"
        };

        var inviteDto = new InviteCollaboratorDto
        {
            Email = "invitee@example.com",
            Role = CollaboratorRole.Write
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(inviteDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(userToInvite);

        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, inviteeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Collaboration?)null);

        _collaborationRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Collaboration>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Collaboration c, CancellationToken _) => c);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        var result = await _collaborationService.InviteAsync(projectId, ownerId, inviteDto);

        // ===== ASSERT =====
        result.Should().NotBeNull();
        result.Username.Should().Be("invitee");
        result.Role.Should().Be(CollaboratorRole.Write);

        _collaborationRepositoryMock.Verify(
            r => r.AddAsync(It.Is<Collaboration>(c =>
                c.ProjectId == projectId &&
                c.UserId == inviteeId &&
                c.Role == CollaboratorRole.Write),
                It.IsAny<CancellationToken>()),
            Times.Once
        );
    }

    /// <summary>
    /// Test : Un admin peut aussi inviter des collaborateurs.
    /// </summary>
    [Fact]
    public async Task InviteAsync_AsAdmin_ShouldCreateInvitation()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var adminId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var inviteeId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            Name = "Mon Projet",
            OwnerId = ownerId
        };

        var userToInvite = new User
        {
            Id = inviteeId,
            Email = "invitee@example.com",
            Username = "invitee"
        };

        var inviteDto = new InviteCollaboratorDto
        {
            Email = "invitee@example.com",
            Role = CollaboratorRole.Read
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // L'admin a le rôle Admin
        _collaborationRepositoryMock
            .Setup(r => r.GetUserRoleAsync(projectId, adminId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CollaboratorRole.Admin);

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(inviteDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(userToInvite);

        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, inviteeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Collaboration?)null);

        _collaborationRepositoryMock
            .Setup(r => r.AddAsync(It.IsAny<Collaboration>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Collaboration c, CancellationToken _) => c);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        var result = await _collaborationService.InviteAsync(projectId, adminId, inviteDto);

        // ===== ASSERT =====
        result.Should().NotBeNull();
        result.Role.Should().Be(CollaboratorRole.Read);
    }

    /// <summary>
    /// Test : Un collaborateur non-admin ne peut pas inviter.
    /// </summary>
    [Fact]
    public async Task InviteAsync_AsWriteCollaborator_ShouldThrow()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var writerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            Name = "Mon Projet",
            OwnerId = ownerId
        };

        var inviteDto = new InviteCollaboratorDto
        {
            Email = "invitee@example.com",
            Role = CollaboratorRole.Read
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // Le collaborateur n'a que le rôle Write (pas Admin)
        _collaborationRepositoryMock
            .Setup(r => r.GetUserRoleAsync(projectId, writerId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CollaboratorRole.Write);

        // ===== ACT & ASSERT =====
        var act = () => _collaborationService.InviteAsync(projectId, writerId, inviteDto);

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "NOT_AUTHORIZED");
    }

    /// <summary>
    /// Test : Impossible d'inviter le propriétaire du projet.
    /// </summary>
    [Fact]
    public async Task InviteAsync_OwnerAsInvitee_ShouldThrow()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            Name = "Mon Projet",
            OwnerId = ownerId
        };

        var owner = new User
        {
            Id = ownerId,
            Email = "owner@example.com",
            Username = "owner"
        };

        var inviteDto = new InviteCollaboratorDto
        {
            Email = "owner@example.com",
            Role = CollaboratorRole.Write
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(inviteDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(owner);

        // ===== ACT & ASSERT =====
        var act = () => _collaborationService.InviteAsync(projectId, ownerId, inviteDto);

        await act.Should()
            .ThrowAsync<ValidationException>()
            .Where(e => e.Code == "CANNOT_INVITE_OWNER");
    }

    /// <summary>
    /// Test : Impossible d'inviter un utilisateur déjà collaborateur.
    /// </summary>
    [Fact]
    public async Task InviteAsync_AlreadyCollaborator_ShouldThrow()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var inviteeId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = ownerId
        };

        var userToInvite = new User
        {
            Id = inviteeId,
            Email = "invitee@example.com",
            Username = "invitee"
        };

        var existingCollaboration = new Collaboration
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = inviteeId
        };

        var inviteDto = new InviteCollaboratorDto
        {
            Email = "invitee@example.com",
            Role = CollaboratorRole.Write
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        _userRepositoryMock
            .Setup(r => r.GetByEmailAsync(inviteDto.Email, It.IsAny<CancellationToken>()))
            .ReturnsAsync(userToInvite);

        // L'utilisateur est déjà collaborateur
        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, inviteeId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingCollaboration);

        // ===== ACT & ASSERT =====
        var act = () => _collaborationService.InviteAsync(projectId, ownerId, inviteDto);

        await act.Should()
            .ThrowAsync<ConflictException>()
            .Where(e => e.Code == "ALREADY_COLLABORATOR");
    }

    #endregion

    #region AcceptInvitationAsync Tests

    /// <summary>
    /// Test : Accepter une invitation valide.
    /// </summary>
    [Fact]
    public async Task AcceptInvitationAsync_ValidInvitation_ShouldAccept()
    {
        // ===== ARRANGE =====
        var userId = Guid.NewGuid();
        var collaborationId = Guid.NewGuid();

        var collaboration = new Collaboration
        {
            Id = collaborationId,
            UserId = userId,
            ProjectId = Guid.NewGuid(),
            AcceptedAt = null // Pas encore acceptée
        };

        _collaborationRepositoryMock
            .Setup(r => r.GetByIdAsync(collaborationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaboration);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        await _collaborationService.AcceptInvitationAsync(collaborationId, userId);

        // ===== ASSERT =====
        collaboration.AcceptedAt.Should().NotBeNull();

        _collaborationRepositoryMock.Verify(
            r => r.Update(It.Is<Collaboration>(c => c.AcceptedAt != null)),
            Times.Once
        );
    }

    /// <summary>
    /// Test : Refuser une invitation qui ne nous appartient pas.
    /// </summary>
    [Fact]
    public async Task AcceptInvitationAsync_NotYourInvitation_ShouldThrow()
    {
        // ===== ARRANGE =====
        var userId = Guid.NewGuid();
        var otherUserId = Guid.NewGuid();
        var collaborationId = Guid.NewGuid();

        var collaboration = new Collaboration
        {
            Id = collaborationId,
            UserId = otherUserId, // Appartient à quelqu'un d'autre
            ProjectId = Guid.NewGuid()
        };

        _collaborationRepositoryMock
            .Setup(r => r.GetByIdAsync(collaborationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaboration);

        // ===== ACT & ASSERT =====
        var act = () => _collaborationService.AcceptInvitationAsync(collaborationId, userId);

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "NOT_YOUR_INVITATION");
    }

    /// <summary>
    /// Test : Accepter une invitation déjà acceptée.
    /// </summary>
    [Fact]
    public async Task AcceptInvitationAsync_AlreadyAccepted_ShouldThrow()
    {
        // ===== ARRANGE =====
        var userId = Guid.NewGuid();
        var collaborationId = Guid.NewGuid();

        var collaboration = new Collaboration
        {
            Id = collaborationId,
            UserId = userId,
            ProjectId = Guid.NewGuid(),
            AcceptedAt = DateTime.UtcNow.AddDays(-1) // Déjà acceptée
        };

        _collaborationRepositoryMock
            .Setup(r => r.GetByIdAsync(collaborationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaboration);

        // ===== ACT & ASSERT =====
        var act = () => _collaborationService.AcceptInvitationAsync(collaborationId, userId);

        await act.Should()
            .ThrowAsync<ValidationException>()
            .Where(e => e.Code == "ALREADY_ACCEPTED");
    }

    #endregion

    #region DeclineInvitationAsync Tests

    /// <summary>
    /// Test : Refuser une invitation valide.
    /// </summary>
    [Fact]
    public async Task DeclineInvitationAsync_ValidInvitation_ShouldRemove()
    {
        // ===== ARRANGE =====
        var userId = Guid.NewGuid();
        var collaborationId = Guid.NewGuid();

        var collaboration = new Collaboration
        {
            Id = collaborationId,
            UserId = userId,
            ProjectId = Guid.NewGuid()
        };

        _collaborationRepositoryMock
            .Setup(r => r.GetByIdAsync(collaborationId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaboration);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        await _collaborationService.DeclineInvitationAsync(collaborationId, userId);

        // ===== ASSERT =====
        _collaborationRepositoryMock.Verify(
            r => r.Remove(collaboration),
            Times.Once
        );
    }

    #endregion

    #region UpdateRoleAsync Tests

    /// <summary>
    /// Test : Le propriétaire peut modifier le rôle d'un collaborateur.
    /// </summary>
    [Fact]
    public async Task UpdateRoleAsync_AsOwner_ShouldUpdateRole()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var collaboratorId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = ownerId
        };

        var collaboration = new Collaboration
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = collaboratorId,
            Role = CollaboratorRole.Read
        };

        var collaborator = new User
        {
            Id = collaboratorId,
            Username = "collab",
            Email = "collab@example.com"
        };

        var updateDto = new UpdateCollaboratorRoleDto
        {
            Role = CollaboratorRole.Admin
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, collaboratorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaboration);

        _userRepositoryMock
            .Setup(r => r.GetByIdAsync(collaboratorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaborator);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        var result = await _collaborationService.UpdateRoleAsync(projectId, collaboratorId, ownerId, updateDto);

        // ===== ASSERT =====
        result.Should().NotBeNull();
        result.Role.Should().Be(CollaboratorRole.Admin);

        _collaborationRepositoryMock.Verify(
            r => r.Update(It.Is<Collaboration>(c => c.Role == CollaboratorRole.Admin)),
            Times.Once
        );
    }

    /// <summary>
    /// Test : Un non-propriétaire ne peut pas modifier les rôles.
    /// </summary>
    [Fact]
    public async Task UpdateRoleAsync_NotOwner_ShouldThrow()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var notOwnerId = Guid.NewGuid();
        var collaboratorId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = ownerId
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // ===== ACT & ASSERT =====
        var act = () => _collaborationService.UpdateRoleAsync(
            projectId, collaboratorId, notOwnerId, new UpdateCollaboratorRoleDto());

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "NOT_OWNER");
    }

    #endregion

    #region RemoveCollaboratorAsync Tests

    /// <summary>
    /// Test : Le propriétaire peut supprimer un collaborateur.
    /// </summary>
    [Fact]
    public async Task RemoveCollaboratorAsync_AsOwner_ShouldRemove()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var collaboratorId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = ownerId
        };

        var collaboration = new Collaboration
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = collaboratorId
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, collaboratorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaboration);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        await _collaborationService.RemoveCollaboratorAsync(projectId, collaboratorId, ownerId);

        // ===== ASSERT =====
        _collaborationRepositoryMock.Verify(
            r => r.Remove(collaboration),
            Times.Once
        );
    }

    /// <summary>
    /// Test : Un collaborateur peut se retirer lui-même.
    /// </summary>
    [Fact]
    public async Task RemoveCollaboratorAsync_Self_ShouldRemove()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var collaboratorId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = ownerId
        };

        var collaboration = new Collaboration
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = collaboratorId
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectAndUserAsync(projectId, collaboratorId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaboration);

        _unitOfWorkMock
            .Setup(u => u.SaveChangesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(1);

        // ===== ACT =====
        // Le collaborateur se supprime lui-même (currentUserId = collaboratorId)
        await _collaborationService.RemoveCollaboratorAsync(projectId, collaboratorId, collaboratorId);

        // ===== ASSERT =====
        _collaborationRepositoryMock.Verify(
            r => r.Remove(collaboration),
            Times.Once
        );
    }

    /// <summary>
    /// Test : Un tiers ne peut pas supprimer un collaborateur.
    /// </summary>
    [Fact]
    public async Task RemoveCollaboratorAsync_ThirdParty_ShouldThrow()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var collaboratorId = Guid.NewGuid();
        var thirdPartyId = Guid.NewGuid();
        var projectId = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = ownerId
        };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        // ===== ACT & ASSERT =====
        var act = () => _collaborationService.RemoveCollaboratorAsync(projectId, collaboratorId, thirdPartyId);

        await act.Should()
            .ThrowAsync<UnauthorizedException>()
            .Where(e => e.Code == "NOT_AUTHORIZED");
    }

    #endregion

    #region GetCollaboratorsAsync Tests

    /// <summary>
    /// Test : Récupérer les collaborateurs d'un projet.
    /// </summary>
    [Fact]
    public async Task GetCollaboratorsAsync_AsOwner_ShouldReturnCollaborators()
    {
        // ===== ARRANGE =====
        var ownerId = Guid.NewGuid();
        var projectId = Guid.NewGuid();
        var collab1Id = Guid.NewGuid();
        var collab2Id = Guid.NewGuid();

        var project = new Project
        {
            Id = projectId,
            OwnerId = ownerId,
            IsPublic = false
        };

        var collaborations = new List<Collaboration>
        {
            new() { Id = Guid.NewGuid(), ProjectId = projectId, UserId = collab1Id, Role = CollaboratorRole.Write },
            new() { Id = Guid.NewGuid(), ProjectId = projectId, UserId = collab2Id, Role = CollaboratorRole.Read }
        };

        var user1 = new User { Id = collab1Id, Username = "collab1", Email = "collab1@example.com" };
        var user2 = new User { Id = collab2Id, Username = "collab2", Email = "collab2@example.com" };

        _projectRepositoryMock
            .Setup(r => r.GetByIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(project);

        _collaborationRepositoryMock
            .Setup(r => r.GetByProjectIdAsync(projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(collaborations);

        _userRepositoryMock
            .Setup(r => r.GetByIdAsync(collab1Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user1);

        _userRepositoryMock
            .Setup(r => r.GetByIdAsync(collab2Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user2);

        // ===== ACT =====
        var result = await _collaborationService.GetCollaboratorsAsync(projectId, ownerId);

        // ===== ASSERT =====
        var list = result.ToList();
        list.Should().HaveCount(2);
        list.Should().Contain(c => c.Username == "collab1");
        list.Should().Contain(c => c.Username == "collab2");
    }

    #endregion
}
