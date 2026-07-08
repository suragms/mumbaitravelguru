using System.Collections.Concurrent;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Infrastructure.Services.Flights;

public class InMemoryFareLockStore : IFareLockStore
{
    private readonly ConcurrentDictionary<string, FareLock> _locks = new();

    public void Add(FareLock fareLock)
    {
        _locks[fareLock.LockId] = fareLock;
        CleanExpired();
    }

    public FareLock? Get(string lockId)
    {
        CleanExpired();
        if (_locks.TryGetValue(lockId, out var fareLock) && !fareLock.IsExpired)
            return fareLock;
        return null;
    }

    public void MarkUsed(string lockId)
    {
        if (_locks.TryGetValue(lockId, out var fareLock))
        {
            fareLock.IsUsed = true;
        }
    }

    public void CleanExpired()
    {
        var now = DateTime.UtcNow;
        foreach (var kvp in _locks)
        {
            if (kvp.Value.IsExpired)
                _locks.TryRemove(kvp.Key, out _);
        }
    }
}
