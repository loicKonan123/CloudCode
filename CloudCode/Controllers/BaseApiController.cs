using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur de base avec helpers communs.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Récupère l'ID de l'utilisateur connecté depuis le token JWT.
    /// </summary>
    protected Guid? CurrentUserId
    {
        get
        {
            var userIdClaim = User.FindFirst("userId") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
            return null;
        }
    }

    /// <summary>
    /// Récupère l'ID de l'utilisateur ou retourne Unauthorized.
    /// </summary>
    protected Guid GetRequiredUserId()
    {
        return CurrentUserId ?? throw new UnauthorizedAccessException("User not authenticated");
    }
}
