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

    /// <summary>
    /// Constructeur avec code personnalisé et message.
    /// </summary>
    public ConflictException(string code, string message)
        : base(message, code)
    {
    }

    public ConflictException(string field, object value, bool useFieldValue)
        : base($"A resource with {field} '{value}' already exists", "CONFLICT")
    {
        ConflictingField = field;
        ConflictingValue = value;
    }

    public static ConflictException EmailAlreadyExists(string email)
    {
        return new ConflictException("EMAIL_EXISTS", $"Un compte avec l'email '{email}' existe déjà.");
    }

    public static ConflictException UsernameAlreadyExists(string username)
    {
        return new ConflictException("USERNAME_EXISTS", $"Le nom d'utilisateur '{username}' est déjà pris.");
    }
}
