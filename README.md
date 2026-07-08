# Mumbai Travel Guru (OTA Platform)

Mumbai Travel Guru is a full-scale Online Travel Aggregator (OTA) platform—functionally inspired by industry leaders like MakeMyTrip, Cleartrip, and EaseMyTrip. Users can search and book Flights, Hotels, Buses, Cabs, and Holiday Packages. The platform is designed from the ground up for high-performance, visual excellence, transaction security, and modular scaling.

---

## 🚀 Tech Stack

### Backend
*   **Core API:** ASP.NET Core Web API (.NET 8/10 LTS) in C#
*   **Architecture:** Clean Architecture (Domain / Application / Infrastructure / API layers)
*   **Data Access:** Entity Framework Core with Code-First Migrations
*   **Relational Database:** PostgreSQL
*   **Caching & Session Storage:** Redis
*   **Message Broker:** Azure Service Bus or RabbitMQ (for async processing/notification workers)

### Frontend
*   **Core UI:** React.js (v19) + TypeScript
*   **Rendering:** Next.js (v15) for SEO-critical SSR pages
*   **Styling:** Tailwind CSS (v4) with custom glassmorphism and metallic themes
*   **Server-State:** TanStack React Query

---

## 📂 Project Architecture Layout

```
mumbaitravelguru/
│
├── MumbaiTravelGuru.slnx                # Modern XML-based .NET Solution file
├── docker-compose.yml                  # PostgreSQL and Redis setup for local development
├── .gitignore                          # Unified Gitignore mapping .NET & Node artifacts
│
├── src/                                # Backend projects
│   ├── MumbaiTravelGuru.Domain/        # Value Objects, Domain Entities, Enums (Free of framework dependencies)
│   ├── MumbaiTravelGuru.Application/   # DTOs, CQRS Handlers (MediatR), Validators (FluentValidation)
│   ├── MumbaiTravelGuru.Infrastructure/# persistence (EF Core Context), Identity services, Token services
│   ├── MumbaiTravelGuru.API/           # Controllers, middlewares, program routing configuration
│   └── MumbaiTravelGuru.Application.UnitTests/ # xUnit test suite (rounding, validators, idempotency tests)
│
└── MumbaiTravelGuru.Client/            # Next.js frontend client app (App router, React Query, Tailwind v4)
```

---

## 🛠️ Core Conventions & Design Principles

*   **Financial Safety:** All monetary fields are stored as `decimal` type (never `float` or `double`). Monetary/price calculations happen exclusively server-side.
*   **Idempotency Keys:** State-changing endpoints (bookings, wallet credit/debit, and payment creation) require unique `ReferenceId` headers/payload keys. Duplicate requests with the same reference are identified and returned from logs to prevent double-submits.
*   **Soft Deletes:** Deletions of booking entries, financial logs, and user records use status flags (`IsDeleted`) instead of hard database row removal.
*   **Audit Logging:** Every user login, registration, admin adjustment, wallet credit, or payment override writes a detailed entry to the `AuditLogs` table.

---

## ⚙️ Local Development Setup

### Prerequisites
*   [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) or higher
*   [Node.js (v20+)](https://nodejs.org/) & npm
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for database and caching)

### Step 1: Start PostgreSQL and Redis
From the project root directory, spin up local developer environment containers:
```bash
docker compose up -d
```

### Step 2: Apply Migrations & Start Backend API
Ensure the database schema is up-to-date and launch the .NET API:
```bash
# Apply migrations to local PostgreSQL database
dotnet ef database update --project src/MumbaiTravelGuru.Infrastructure --startup-project src/MumbaiTravelGuru.API

# Run Web API project
dotnet run --project src/MumbaiTravelGuru.API
```
The API is available at:
*   Swagger UI: `http://localhost:5189/swagger/index.html` (or `https://localhost:7119/swagger/index.html`)

### Step 3: Run Unit Tests
To execute domain rules and handler unit tests:
```bash
dotnet test
```

### Step 4: Start Next.js Frontend Client
Change directory to the client application and start the development server:
```bash
cd MumbaiTravelGuru.Client
npm run dev
```
Open `http://localhost:3000` in your web browser.

---

## ✉️ Authors & Ownership

This project is developed and maintained by **HexaStack Solutions**:
*   **Anandu Krishna** — Co-Founder & Product Lead (UI/UX, strategy, analytics)
*   **Surag** — Co-Founder & Full Stack Developer (Backend design, database, integrations, testing)

*© 2026 HexaStack Solutions. Developed by Surag. All rights reserved.*
