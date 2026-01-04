namespace CloudCode.Domain.Exceptions;

/// <summary>
/// Exception levée lors d'un accès non autorisé à une ressource.
/// </summary>
public class UnauthorizedException : DomainException
{
    public string? Resource { get; }
    public string? Action { get; }

    public UnauthorizedException(string message = "Access denied")
        : base(message, "UNAUTHORIZED")
    {
    }

    /// <summary>
    /// Constructeur avec code personnalisé et message.
    /// </summary>
    public UnauthorizedException(string code, string message)
        : base(message, code)
    {
    }

    public UnauthorizedException(string resource, string action, bool useResourceAction)
        : base($"You don't have permission to {action} this {resource}", "UNAUTHORIZED")
    {
        Resource = resource;
        Action = action;
    }
}
