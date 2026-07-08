using MumbaiTravelGuru.Domain.Models;

namespace MumbaiTravelGuru.Application.Common.Interfaces;

public interface IFareLockStore
{
    void Add(FareLock fareLock);
    FareLock? Get(string lockId);
    void MarkUsed(string lockId);
    void CleanExpired();
}
