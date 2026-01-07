using CloudCode.Application.DTOs.Collaboration;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur de gestion des collaborations.
/// </summary>
[Authorize]
public class CollaborationsController : BaseApiController
{
    private readonly ICollaborationService _collaborationService;

    public CollaborationsController(ICollaborationService collaborationService)
    {
        _collaborationService = collaborationService;
    }

    /// <summary>
    /// Récupérer les collaborateurs d'un projet.
    /// </summary>
    [HttpGet("project/{projectId:guid}")]
    [ProducesResponseType(typeof(IEnumerable<CollaboratorResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<CollaboratorResponseDto>>> GetCollaborators(Guid projectId)
    {
        var userId = GetRequiredUserId();
        var collaborators = await _collaborationService.GetCollaboratorsAsync(projectId, userId);
        return Ok(collaborators);
    }

    /// <summary>
    /// Inviter un collaborateur.
    /// </summary>
    [HttpPost("project/{projectId:guid}/invite")]
    [ProducesResponseType(typeof(CollaboratorResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CollaboratorResponseDto>> InviteCollaborator(Guid projectId, [FromBody] InviteCollaboratorDto dto)
    {
        var userId = GetRequiredUserId();
        var collaborator = await _collaborationService.InviteAsync(projectId, userId, dto);
        return Created($"/api/collaborations/project/{projectId}", collaborator);
    }

    /// <summary>
    /// Modifier le rôle d'un collaborateur.
    /// </summary>
    [HttpPut("project/{projectId:guid}/user/{collaboratorUserId:guid}")]
    [ProducesResponseType(typeof(CollaboratorResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CollaboratorResponseDto>> UpdateRole(
        Guid projectId,
        Guid collaboratorUserId,
        [FromBody] UpdateCollaboratorRoleDto dto)
    {
        var userId = GetRequiredUserId();
        var collaborator = await _collaborationService.UpdateRoleAsync(projectId, collaboratorUserId, userId, dto);
        return Ok(collaborator);
    }

    /// <summary>
    /// Supprimer un collaborateur.
    /// </summary>
    [HttpDelete("project/{projectId:guid}/user/{collaboratorUserId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult> RemoveCollaborator(Guid projectId, Guid collaboratorUserId)
    {
        var userId = GetRequiredUserId();
        await _collaborationService.RemoveCollaboratorAsync(projectId, collaboratorUserId, userId);
        return NoContent();
    }

    /// <summary>
    /// Récupérer mes invitations en attente.
    /// </summary>
    [HttpGet("invitations")]
    [ProducesResponseType(typeof(IEnumerable<PendingInvitationDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<PendingInvitationDto>>> GetPendingInvitations()
    {
        var userId = GetRequiredUserId();
        var invitations = await _collaborationService.GetPendingInvitationsAsync(userId);
        return Ok(invitations);
    }

    /// <summary>
    /// Accepter une invitation.
    /// </summary>
    [HttpPost("invitations/{collaborationId:guid}/accept")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> AcceptInvitation(Guid collaborationId)
    {
        var userId = GetRequiredUserId();
        await _collaborationService.AcceptInvitationAsync(collaborationId, userId);
        return Ok(new { message = "Invitation acceptée" });
    }

    /// <summary>
    /// Refuser une invitation.
    /// </summary>
    [HttpPost("invitations/{collaborationId:guid}/decline")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeclineInvitation(Guid collaborationId)
    {
        var userId = GetRequiredUserId();
        await _collaborationService.DeclineInvitationAsync(collaborationId, userId);
        return Ok(new { message = "Invitation refusée" });
    }

    /// <summary>
    /// Quitter un projet (se retirer en tant que collaborateur).
    /// </summary>
    [HttpPost("project/{projectId:guid}/leave")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> LeaveProject(Guid projectId)
    {
        var userId = GetRequiredUserId();
        await _collaborationService.RemoveCollaboratorAsync(projectId, userId, userId);
        return Ok(new { message = "Vous avez quitté le projet" });
    }
}
