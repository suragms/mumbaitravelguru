using System.Reflection;
using System.Text.Json;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Domain.Entities;

namespace MumbaiTravelGuru.Application.Common.Behaviours;

public class AdminAuditLogBehaviour<TRequest, TResponse> : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<AdminAuditLogBehaviour<TRequest, TResponse>> _logger;

    public AdminAuditLogBehaviour(
        IApplicationDbContext context, ICurrentUserService currentUser,
        ILogger<AdminAuditLogBehaviour<TRequest, TResponse>> logger)
    {
        _context = context; _currentUser = currentUser; _logger = logger;
    }

    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        var adminAttr = typeof(TRequest).GetCustomAttribute<AdminActionAttribute>();
        if (adminAttr == null)
            return await next();

        var response = await next();

        try
        {
            var userId = _currentUser.UserId;
            var details = adminAttr.Description;

            if (!string.IsNullOrEmpty(adminAttr.EntityIdProperty))
            {
                var prop = typeof(TRequest).GetProperty(adminAttr.EntityIdProperty);
                if (prop != null)
                {
                    var val = prop.GetValue(request);
                    details = $"{details} | EntityId:{val}";
                }
            }

            if (adminAttr.LogRequest && request != null)
            {
                try
                {
                    var requestJson = JsonSerializer.Serialize(request, new JsonSerializerOptions
                    {
                        WriteIndented = false,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    });
                    if (requestJson.Length > 2000)
                        requestJson = requestJson[..2000];
                    details = $"{details} | Request:{requestJson}";
                }
                catch { }
            }

            _context.AuditLogs.Add(new AuditLog
            {
                Action = adminAttr.ActionName,
                UserId = userId,
                UserEmail = _currentUser.Email,
                Details = details,
                EntityType = adminAttr.EntityType,
                EntityId = adminAttr.EntityIdProperty != null
                    ? typeof(TRequest).GetProperty(adminAttr.EntityIdProperty)?.GetValue(request) as Guid?
                    : null,
            });

            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write admin audit log for {RequestType}", typeof(TRequest).Name);
        }

        return response;
    }
}

[AttributeUsage(AttributeTargets.Class, Inherited = false)]
public class AdminActionAttribute : Attribute
{
    public string ActionName { get; }
    public string Description { get; }
    public string? EntityType { get; set; }
    public string? EntityIdProperty { get; set; }
    public bool LogRequest { get; set; }

    public AdminActionAttribute(string actionName, string description)
    {
        ActionName = actionName;
        Description = description;
    }
}
