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

    public UnauthorizedException(string resource, string action)
        : base($"You don't have permission to {action} this {resource}", "UNAUTHORIZED")
    {
        Resource = resource;
        Action = action;
    }
}
