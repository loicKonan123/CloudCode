using CloudCode.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Data;

/// <summary>
/// Contexte de base de données Entity Framework Core.
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<CodeFile> CodeFiles => Set<CodeFile>();
    public DbSet<Collaboration> Collaborations => Set<Collaboration>();
    public DbSet<ExecutionResult> ExecutionResults => Set<ExecutionResult>();
    public DbSet<ProjectDependency> ProjectDependencies => Set<ProjectDependency>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<EnvironmentVariable> EnvironmentVariables => Set<EnvironmentVariable>();
    public DbSet<GitCredential> GitCredentials => Set<GitCredential>();
    public DbSet<Challenge> Challenges => Set<Challenge>();
    public DbSet<TestCase> TestCases => Set<TestCase>();
    public DbSet<UserSubmission> UserSubmissions => Set<UserSubmission>();
    public DbSet<UserProgress> UserProgress => Set<UserProgress>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Applique toutes les configurations du même assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Met à jour automatiquement les timestamps
        foreach (var entry in ChangeTracker.Entries<Domain.Common.BaseEntity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
