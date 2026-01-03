namespace CloudCode.Domain.Exceptions;

/// <summary>
/// Exception levée quand une entité n'est pas trouvée.
/// </summary>
public class NotFoundException : DomainException
{
    public string EntityName { get; }
    public object? EntityId { get; }

    public NotFoundException(string entityName, object? entityId = null)
        : base($"{entityName} not found" + (entityId != null ? $" with id '{entityId}'" : ""), "NOT_FOUND")
    {
        EntityName = entityName;
        EntityId = entityId;
    }

    public static NotFoundException ForEntity<T>(Guid id) where T : class
    {
        return new NotFoundException(typeof(T).Name, id);
    }
}
