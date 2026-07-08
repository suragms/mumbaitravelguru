using System;

namespace MumbaiTravelGuru.Application.Common.Interfaces
{
    public interface ICurrentUserService
    {
        Guid? UserId { get; }
        string? Role { get; }
        string? Email { get; }
    }
}
