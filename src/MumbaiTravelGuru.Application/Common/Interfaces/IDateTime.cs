using System;

namespace MumbaiTravelGuru.Application.Common.Interfaces
{
    public interface IDateTime
    {
        DateTime UtcNow { get; }
    }
}
