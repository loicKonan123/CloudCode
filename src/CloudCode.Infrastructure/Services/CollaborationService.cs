using CloudCode.Application.DTOs.Collaboration;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Domain.Exceptions;
using CloudCode.Domain.Interfaces;

namespace CloudCode.Infrastructure.Services;

/// <summary>
/// Service de gestion des collaborations sur les projets.
/// </summary>
public class CollaborationService : ICollaborationService
{
    private readonly IUnitOfWork _unitOfWork;

    public CollaborationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<CollaboratorResponseDto> InviteAsync(Guid projectId, Guid inviterId, InviteCollaboratorDto dto, CancellationToken cancellationToken = default)
    {
        // Vérifier que le projet existe
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Vérifier que l'inviteur est le propriétaire ou admin
        if (project.OwnerId != inviterId)
        {
            var inviterRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, inviterId, cancellationToken);
            if (inviterRole != CollaboratorRole.Admin)
            {
                throw new UnauthorizedException("NOT_AUTHORIZED", "Seul le propriétaire ou un admin peut inviter des collaborateurs.");
            }
        }

        // Trouver l'utilisateur à inviter
        var userToInvite = await _unitOfWork.Users.GetByEmailAsync(dto.Email, cancellationToken)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Aucun utilisateur avec cet email.");

        // Vérifier que l'utilisateur n'est pas le propriétaire
        if (userToInvite.Id == project.OwnerId)
        {
            throw new ValidationException("CANNOT_INVITE_OWNER", "Impossible d'inviter le propriétaire du projet.");
        }

        // Vérifier qu'il n'est pas déjà collaborateur
        var existing = await _unitOfWork.Collaborations.GetByProjectAndUserAsync(projectId, userToInvite.Id, cancellationToken);
        if (existing != null)
        {
            throw new ConflictException("ALREADY_COLLABORATOR", "Cet utilisateur est déjà collaborateur du projet.");
        }

        var collaboration = new Collaboration
        {
            Id = Guid.NewGuid(),
            ProjectId = projectId,
            UserId = userToInvite.Id,
            Role = dto.Role,
            InvitedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Collaborations.AddAsync(collaboration, cancellationToken);
        await _unitOfWork.SaveChangesAsync();

        return MapToResponseDto(collaboration, userToInvite);
    }

    public async Task<IEnumerable<CollaboratorResponseDto>> GetCollaboratorsAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        // Vérifier l'accès au projet
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        if (!project.IsPublic && project.OwnerId != userId)
        {
            var userRole = await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
            if (userRole == null)
            {
                throw new UnauthorizedException("ACCESS_DENIED", "Vous n'avez pas accès à ce projet.");
            }
        }

        var collaborations = await _unitOfWork.Collaborations.GetByProjectIdAsync(projectId, cancellationToken);

        var result = new List<CollaboratorResponseDto>();
        foreach (var collab in collaborations)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(collab.UserId, cancellationToken);
            if (user != null)
            {
                result.Add(MapToResponseDto(collab, user));
            }
        }

        return result;
    }

    public async Task<CollaboratorResponseDto> UpdateRoleAsync(Guid projectId, Guid collaboratorUserId, Guid currentUserId, UpdateCollaboratorRoleDto dto, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Seul le propriétaire peut changer les rôles
        if (project.OwnerId != currentUserId)
        {
            throw new UnauthorizedException("NOT_OWNER", "Seul le propriétaire peut modifier les rôles.");
        }

        var collaboration = await _unitOfWork.Collaborations.GetByProjectAndUserAsync(projectId, collaboratorUserId, cancellationToken)
            ?? throw new NotFoundException("COLLABORATOR_NOT_FOUND", "Collaborateur non trouvé.");

        collaboration.Role = dto.Role;
        collaboration.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Collaborations.Update(collaboration);
        await _unitOfWork.SaveChangesAsync();

        var user = await _unitOfWork.Users.GetByIdAsync(collaboratorUserId, cancellationToken);
        return MapToResponseDto(collaboration, user!);
    }

    public async Task RemoveCollaboratorAsync(Guid projectId, Guid collaboratorUserId, Guid currentUserId, CancellationToken cancellationToken = default)
    {
        var project = await _unitOfWork.Projects.GetByIdAsync(projectId, cancellationToken)
            ?? throw new NotFoundException("PROJECT_NOT_FOUND", "Projet non trouvé.");

        // Le propriétaire ou le collaborateur lui-même peut supprimer
        if (project.OwnerId != currentUserId && collaboratorUserId != currentUserId)
        {
            throw new UnauthorizedException("NOT_AUTHORIZED", "Vous ne pouvez pas supprimer ce collaborateur.");
        }

        var collaboration = await _unitOfWork.Collaborations.GetByProjectAndUserAsync(projectId, collaboratorUserId, cancellationToken)
            ?? throw new NotFoundException("COLLABORATOR_NOT_FOUND", "Collaborateur non trouvé.");

        _unitOfWork.Collaborations.Remove(collaboration);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<PendingInvitationDto>> GetPendingInvitationsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var invitations = await _unitOfWork.Collaborations.GetPendingInvitationsAsync(userId, cancellationToken);

        var result = new List<PendingInvitationDto>();
        foreach (var collab in invitations)
        {
            var project = await _unitOfWork.Projects.GetByIdAsync(collab.ProjectId, cancellationToken);
            if (project != null)
            {
                var owner = await _unitOfWork.Users.GetByIdAsync(project.OwnerId, cancellationToken);
                result.Add(new PendingInvitationDto
                {
                    CollaborationId = collab.Id,
                    ProjectId = project.Id,
                    ProjectName = project.Name,
                    InviterUsername = owner?.Username ?? "Unknown",
                    Role = collab.Role,
                    InvitedAt = collab.InvitedAt
                });
            }
        }

        return result;
    }

    public async Task AcceptInvitationAsync(Guid collaborationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var collaboration = await _unitOfWork.Collaborations.GetByIdAsync(collaborationId, cancellationToken)
            ?? throw new NotFoundException("INVITATION_NOT_FOUND", "Invitation non trouvée.");

        if (collaboration.UserId != userId)
        {
            throw new UnauthorizedException("NOT_YOUR_INVITATION", "Cette invitation ne vous est pas destinée.");
        }

        if (collaboration.AcceptedAt != null)
        {
            throw new ValidationException("ALREADY_ACCEPTED", "Cette invitation a déjà été acceptée.");
        }

        collaboration.AcceptedAt = DateTime.UtcNow;
        collaboration.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Collaborations.Update(collaboration);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeclineInvitationAsync(Guid collaborationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var collaboration = await _unitOfWork.Collaborations.GetByIdAsync(collaborationId, cancellationToken)
            ?? throw new NotFoundException("INVITATION_NOT_FOUND", "Invitation non trouvée.");

        if (collaboration.UserId != userId)
        {
            throw new UnauthorizedException("NOT_YOUR_INVITATION", "Cette invitation ne vous est pas destinée.");
        }

        _unitOfWork.Collaborations.Remove(collaboration);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<CollaboratorRole?> GetUserRoleAsync(Guid projectId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.Collaborations.GetUserRoleAsync(projectId, userId, cancellationToken);
    }

    private CollaboratorResponseDto MapToResponseDto(Collaboration collaboration, User user)
    {
        return new CollaboratorResponseDto
        {
            Id = collaboration.Id,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            Avatar = user.Avatar,
            Role = collaboration.Role,
            InvitedAt = collaboration.InvitedAt,
            AcceptedAt = collaboration.AcceptedAt
        };
    }
}
