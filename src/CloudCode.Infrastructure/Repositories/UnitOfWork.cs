using CloudCode.Domain.Interfaces;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace CloudCode.Infrastructure.Repositories;

/// <summary>
/// Implémentation du pattern Unit of Work pour coordonner les transactions.
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    private IUserRepository? _users;
    private IProjectRepository? _projects;
    private ICodeFileRepository? _files;
    private ICollaborationRepository? _collaborations;
    private IProjectDependencyRepository? _dependencies;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users =>
        _users ??= new UserRepository(_context);

    public IProjectRepository Projects =>
        _projects ??= new ProjectRepository(_context);

    public ICodeFileRepository Files =>
        _files ??= new CodeFileRepository(_context);

    public ICollaborationRepository Collaborations =>
        _collaborations ??= new CollaborationRepository(_context);

    public IProjectDependencyRepository Dependencies =>
        _dependencies ??= new ProjectDependencyRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
    {
        _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
    }

    public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync(cancellationToken);
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}
