namespace CloudCode.Application.Interfaces;

public interface IPremiumService
{
    /// <summary>Returns true if the user has an active premium subscription.</summary>
    Task<bool> IsPremiumActiveAsync(Guid userId);

    /// <summary>Creates a Stripe Checkout session and returns the URL.</summary>
    Task<string> CreateCheckoutSessionAsync(Guid userId, string userEmail, string successUrl, string cancelUrl);

    /// <summary>Handles a Stripe webhook event (raw JSON + signature header).</summary>
    Task HandleWebhookAsync(string json, string stripeSignature);

    /// <summary>Returns the current premium status for the user.</summary>
    Task<PremiumStatusDto> GetStatusAsync(Guid userId);

    /// <summary>Cancels the user's subscription (sets to expire at period end).</summary>
    Task CancelSubscriptionAsync(Guid userId);

    /// <summary>Returns the configured frontend base URL.</summary>
    string GetFrontendUrl();
}

public class PremiumStatusDto
{
    public bool IsActive { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public string? Plan { get; set; }
}
