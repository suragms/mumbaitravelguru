using System;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MumbaiTravelGuru.Application.Common.Interfaces;
using MumbaiTravelGuru.Infrastructure.Identity;
using MumbaiTravelGuru.Infrastructure.Persistence;
using MumbaiTravelGuru.Infrastructure.Services;
using StackExchange.Redis;

namespace MumbaiTravelGuru.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? "Host=localhost;Database=mumbaitravelguru;Username=postgres;Password=StrongPassword123!";

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql(connectionString,
                    builder => builder.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName)));

            services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

            services.AddTransient<IDateTime, DateTimeService>();
            services.AddTransient<IPasswordHasher, PasswordHasher>();
            services.AddTransient<IJwtTokenService, JwtTokenService>();

            var redisConnection = configuration.GetValue<string>("Redis:ConnectionString") ?? "localhost:6379";
            try
            {
                var options = ConfigurationOptions.Parse(redisConnection);
                options.AbortOnConnectFail = false; // Graceful connection fallback in local dev
                services.AddSingleton<IConnectionMultiplexer>(sp => ConnectionMultiplexer.Connect(options));
            }
            catch
            {
                // Fail silently in development if Redis is not started yet
            }

            var secretKey = configuration["JwtSettings:Secret"] ?? "MumbaiTravelGuruSuperSecretKeyKey123!!!";
            var issuer = configuration["JwtSettings:Issuer"] ?? "MumbaiTravelGuru";
            var audience = configuration["JwtSettings:Audience"] ?? "MumbaiTravelGuruUsers";

            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
                };
            });

            return services;
        }
    }
}
