using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CloudCode.Infrastructure.Services;

public class GitCredentialService : IGitCredentialService
{
    private readonly ApplicationDbContext _db;

    public GitCredentialService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<GitCredential?> GetCredentialAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.GitCredentials.FirstOrDefaultAsync(g => g.UserId == userId, ct);
    }

    public async Task<GitCredentialDto> SaveCredentialAsync(Guid userId, string provider, string token, string username, CancellationToken ct = default)
    {
        var existing = await _db.GitCredentials.FirstOrDefaultAsync(g => g.UserId == userId, ct);

        if (existing != null)
        {
            existing.Provider = provider;
            existing.Token = token;
            existing.Username = username;
            _db.GitCredentials.Update(existing);
        }
        else
        {
            _db.GitCredentials.Add(new GitCredential
            {
                UserId = userId,
                Provider = provider,
                Token = token,
                Username = username,
            });
        }

        await _db.SaveChangesAsync(ct);
        return new GitCredentialDto { Provider = provider, Username = username };
    }

    public async Task DeleteCredentialAsync(Guid userId, CancellationToken ct = default)
    {
        var cred = await _db.GitCredentials.FirstOrDefaultAsync(g => g.UserId == userId, ct);
        if (cred != null)
        {
            _db.GitCredentials.Remove(cred);
            await _db.SaveChangesAsync(ct);
        }
    }
}
