using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

// PremiumStatusDto is defined in CloudCode.Application.Interfaces

namespace CloudCode.Controllers;

[Authorize]
public class PremiumController : BaseApiController
{
    private readonly IPremiumService _premiumService;

    public PremiumController(IPremiumService premiumService)
    {
        _premiumService = premiumService;
    }

    /// <summary>Get current user's premium status.</summary>
    [HttpGet("status")]
    public async Task<ActionResult<PremiumStatusDto>> GetStatus()
    {
        var userId = GetRequiredUserId();
        return Ok(await _premiumService.GetStatusAsync(userId));
    }

    /// <summary>Create a Stripe Checkout session and return the redirect URL.</summary>
    [HttpPost("checkout")]
    public async Task<ActionResult<object>> CreateCheckout()
    {
        var userId = GetRequiredUserId();
        var frontendUrl = _premiumService.GetFrontendUrl();

        try
        {
            var url = await _premiumService.CreateCheckoutSessionAsync(
                userId,
                GetUserEmail(),
                successUrl: $"{frontendUrl}/premium/success",
                cancelUrl: $"{frontendUrl}/pricing"
            );
            return Ok(new { url });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Cancel the current user's subscription.</summary>
    [HttpPost("cancel")]
    public async Task<ActionResult> CancelSubscription()
    {
        var userId = GetRequiredUserId();
        try
        {
            await _premiumService.CancelSubscriptionAsync(userId);
            return Ok(new { message = "Subscription cancelled. Access remains until the end of the billing period." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Stripe webhook — must be called without authentication.</summary>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<ActionResult> Webhook()
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"].ToString();

        try
        {
            await _premiumService.HandleWebhookAsync(json, signature);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private string GetUserEmail()
    {
        return User.FindFirst("email")?.Value
            ?? User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value
            ?? string.Empty;
    }
}

