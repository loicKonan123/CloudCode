using CloudCode.Application.DTOs.Users;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

[Authorize]
public class UsersController : BaseApiController
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    /// <summary>
    /// Récupère le profil complet de l'utilisateur connecté avec ses statistiques.
    /// </summary>
    [HttpGet("me/profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileDto>> GetMyProfile()
    {
        var userId = GetRequiredUserId();
        var profile = await _userService.GetProfileAsync(userId);
        return Ok(profile);
    }

    /// <summary>
    /// Met à jour le profil de l'utilisateur connecté (username, bio, avatar).
    /// </summary>
    [HttpPut("me/profile")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserProfileDto>> UpdateMyProfile([FromBody] UpdateProfileDto dto)
    {
        var userId = GetRequiredUserId();
        try
        {
            var profile = await _userService.UpdateProfileAsync(userId, dto);
            return Ok(profile);
        }
        catch (InvalidOperationException ex) when (ex.Message == "USERNAME_TAKEN")
        {
            return Conflict(new { message = "Ce nom d'utilisateur est déjà pris" });
        }
    }
}
