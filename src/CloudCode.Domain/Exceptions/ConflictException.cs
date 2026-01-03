namespace CloudCode.Domain.Exceptions;

/// <summary>
/// Exception levée lors d'un conflit (doublon, état incohérent).
/// Par exemple: email déjà utilisé, nom de projet existant.
/// </summary>
public class ConflictException : DomainException
{
    public string? ConflictingField { get; }
    public object? ConflictingValue { get; }

    public ConflictException(string message)
        : base(message, "CONFLICT")
    {
    }

    public ConflictException(string field, object value)
        : base($"A resource with {field} '{value}' already exists", "CONFLICT")
    {
        ConflictingField = field;
        ConflictingValue = value;
    }

    public static ConflictException EmailAlreadyExists(string email)
    {
        return new ConflictException("email", email);
    }

    public static ConflictException UsernameAlreadyExists(string username)
    {
        return new ConflictException("username", username);
    }
}
