FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["src/MumbaiTravelGuru.API/MumbaiTravelGuru.API.csproj", "MumbaiTravelGuru.API/"]
COPY ["src/MumbaiTravelGuru.Application/MumbaiTravelGuru.Application.csproj", "MumbaiTravelGuru.Application/"]
COPY ["src/MumbaiTravelGuru.Domain/MumbaiTravelGuru.Domain.csproj", "MumbaiTravelGuru.Domain/"]
COPY ["src/MumbaiTravelGuru.Infrastructure/MumbaiTravelGuru.Infrastructure.csproj", "MumbaiTravelGuru.Infrastructure/"]
COPY ["MumbaiTravelGuru.slnx", "."]

RUN dotnet restore "MumbaiTravelGuru.API/MumbaiTravelGuru.API.csproj"

COPY . .

RUN dotnet publish "MumbaiTravelGuru.API/MumbaiTravelGuru.API.csproj" \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "MumbaiTravelGuru.API.dll"]
