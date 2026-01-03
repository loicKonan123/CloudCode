namespace CloudCode.Domain.Exceptions;

/// <summary>
/// Exception levée lors d'une validation échouée des données.
/// </summary>
public class ValidationException : DomainException
{
    public IDictionary<string, string[]> Errors { get; }

    public ValidationException(string message)
        : base(message, "VALIDATION_ERROR")
    {
        Errors = new Dictionary<string, string[]>();
    }

    public ValidationException(IDictionary<string, string[]> errors)
        : base("One or more validation errors occurred", "VALIDATION_ERROR")
    {
        Errors = errors;
    }

    public ValidationException(string field, string error)
        : base($"Validation failed for {field}: {error}", "VALIDATION_ERROR")
    {
        Errors = new Dictionary<string, string[]>
        {
            { field, new[] { error } }
        };
    }
}
