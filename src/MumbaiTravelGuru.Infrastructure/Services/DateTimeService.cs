using System;
using MumbaiTravelGuru.Application.Common.Interfaces;

namespace MumbaiTravelGuru.Infrastructure.Services
{
    public class DateTimeService : IDateTime
    {
        public DateTime UtcNow => DateTime.UtcNow;
    }
}
