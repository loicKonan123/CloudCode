using CloudCode.Application.Interfaces;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;

namespace CloudCode.Infrastructure.Services;

public class PremiumService : IPremiumService
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _config;

    public PremiumService(ApplicationDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
    }

    public async Task<bool> IsPremiumActiveAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return false;
        // Admins have full access to everything
        if (user.IsAdmin) return true;
        return user.IsPremiumActive;
    }

    public async Task<PremiumStatusDto> GetStatusAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null)
            return new PremiumStatusDto { IsActive = false };

        bool isActive = user.IsAdmin || user.IsPremiumActive;
        return new PremiumStatusDto
        {
            IsActive = isActive,
            ExpiresAt = user.IsAdmin ? null : user.PremiumExpiresAt,
            Plan = isActive ? (user.IsAdmin ? "admin" : "monthly") : null
        };
    }

    public async Task<string> CreateCheckoutSessionAsync(
        Guid userId, string userEmail, string successUrl, string cancelUrl)
    {
        var priceId = _config["Stripe:PriceId"]
            ?? throw new InvalidOperationException("Stripe PriceId not configured.");

        // Retrieve or create Stripe customer
        var user = await _db.Users.FindAsync(userId)
            ?? throw new Exception("User not found.");

        string customerId = user.StripeCustomerId ?? await CreateStripeCustomerAsync(user.Id, userEmail);

        var options = new SessionCreateOptions
        {
            Customer = customerId,
            PaymentMethodTypes = ["card"],
            LineItems =
            [
                new SessionLineItemOptions
                {
                    Price = priceId,
                    Quantity = 1
                }
            ],
            Mode = "subscription",
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            ClientReferenceId = userId.ToString(),
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = new Dictionary<string, string> { ["userId"] = userId.ToString() }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options);
        return session.Url;
    }

    public async Task HandleWebhookAsync(string json, string stripeSignature)
    {
        var webhookSecret = _config["Stripe:WebhookSecret"]
            ?? throw new InvalidOperationException("Stripe WebhookSecret not configured.");

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, stripeSignature, webhookSecret);
        }
        catch (StripeException)
        {
            throw new InvalidOperationException("Invalid Stripe webhook signature.");
        }

        switch (stripeEvent.Type)
        {
            case EventTypes.CheckoutSessionCompleted:
                if (stripeEvent.Data.Object is Session session)
                    await ActivatePremiumFromSessionAsync(session);
                break;

            case EventTypes.InvoicePaymentSucceeded:
                if (stripeEvent.Data.Object is Invoice invoice)
                    await RenewPremiumAsync(invoice);
                break;

            case EventTypes.CustomerSubscriptionDeleted:
                if (stripeEvent.Data.Object is Subscription sub)
                    await DeactivatePremiumAsync(sub);
                break;
        }
    }

    public async Task CancelSubscriptionAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId)
            ?? throw new Exception("User not found.");

        if (string.IsNullOrEmpty(user.StripeSubscriptionId))
            throw new InvalidOperationException("No active subscription found.");

        var service = new SubscriptionService();
        await service.CancelAsync(user.StripeSubscriptionId, new SubscriptionCancelOptions
        {
            Prorate = false
        });
        // Premium remains active until period end (handled by CustomerSubscriptionDeleted webhook)
    }

    public string GetFrontendUrl() =>
        _config["App:FrontendUrl"] ?? "http://localhost:3000";

    // ── Private helpers ───────────────────────────────────────────────────────

    private async Task<string> CreateStripeCustomerAsync(Guid userId, string email)
    {
        var options = new CustomerCreateOptions
        {
            Email = email,
            Metadata = new Dictionary<string, string> { ["userId"] = userId.ToString() }
        };
        var service = new CustomerService();
        var customer = await service.CreateAsync(options);

        var user = await _db.Users.FindAsync(userId);
        if (user != null)
        {
            user.StripeCustomerId = customer.Id;
            await _db.SaveChangesAsync();
        }
        return customer.Id;
    }

    private async Task ActivatePremiumFromSessionAsync(Session session)
    {
        if (!Guid.TryParse(session.ClientReferenceId, out var userId)) return;

        var user = await _db.Users.FindAsync(userId);
        if (user == null) return;

        user.IsPremium = true;
        user.PremiumExpiresAt = DateTime.UtcNow.AddMonths(1);
        user.StripeCustomerId = session.CustomerId;
        user.StripeSubscriptionId = session.SubscriptionId;
        await _db.SaveChangesAsync();
    }

    private async Task RenewPremiumAsync(Invoice invoice)
    {
        if (string.IsNullOrEmpty(invoice.SubscriptionId)) return;

        // Find user by subscription ID
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.StripeSubscriptionId == invoice.SubscriptionId);
        if (user == null) return;

        user.IsPremium = true;
        user.PremiumExpiresAt = DateTime.UtcNow.AddMonths(1);
        await _db.SaveChangesAsync();
    }

    private async Task DeactivatePremiumAsync(Subscription subscription)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.StripeSubscriptionId == subscription.Id);
        if (user == null) return;

        user.IsPremium = false;
        user.PremiumExpiresAt = null;
        user.StripeSubscriptionId = null;
        await _db.SaveChangesAsync();
    }
}
