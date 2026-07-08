namespace MumbaiTravelGuru.Domain.Constants;

public static class Roles
{
    public const string Customer = "Customer";
    public const string Admin = "Admin";
    public const string SuperAdmin = "SuperAdmin";
    public const string Ops = "Ops";
    public const string Finance = "Finance";
    public const string ContentManager = "ContentManager";
    public const string Vendor = "Vendor";

    public static readonly string[] AdminRoles = { Admin, SuperAdmin, Ops, Finance, ContentManager };

    public static readonly IReadOnlyList<string> All = new[] { Customer, Admin, SuperAdmin, Ops, Finance, ContentManager, Vendor };
}
