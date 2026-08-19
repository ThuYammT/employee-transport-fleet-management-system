# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo** with two main applications:
- **client/** - React 19 + TypeScript + Vite + Tailwind CSS frontend
- **server/** - NestJS 11 + Prisma + PostgreSQL backend

Project structure:
```
employee-transport-fleet-management-system/
├── client/          # Frontend (React/Vite)
├── server/          # Backend (NestJS/Prisma)
└── package-lock.json
```

## Common Commands

### Frontend (client/)
```bash
cd client
npm run dev        # Start dev server with HMR
npm run build      # TypeScript build + Vite production build
npm run lint       # ESLint check
npm run preview    # Preview production build
```

### Backend (server/)
```bash
cd server
npm run start:dev  # Start with watch mode (NestJS CLI)
npm run build      # Build for production
npm run start:prod # Run production build
npm run lint       # ESLint with auto-fix
npm run test       # Jest unit tests
npm run test:cov   # Jest with coverage
npm run test:e2e   # End-to-end tests
```

### Database (Prisma)
```bash
cd server
npx prisma generate     # Generate Prisma Client
npx prisma migrate dev  # Run migrations in dev
npx prisma studio       # Open Prisma Studio UI
```

## Architecture Overview

### Backend (NestJS) - Domain-Driven Structure
```
server/src/
├── auth/                    # Authentication & authorization
├── users/                   # User management
├── drivers/                 # Driver profiles & assignments
├── vehicles/                # Fleet management
├── trips/                   # Trip scheduling & tracking
├── transport-requests/      # Employee transport requests
├── fuel-logs/               # Fuel consumption tracking
├── maintenance-logs/        # Vehicle maintenance records
├── vehicle-issue-reports/   # Issue reporting & resolution
├── prisma/                  # Prisma service & module
├── app.module.ts            # Root module
└── main.ts                  # Application entry point
```

Each domain module follows the pattern: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.dto.ts`

### Frontend (React) - Feature-Based Structure
```
client/src/
├── components/              # Reusable UI components
├── pages/                   # Page components by role
│   ├── admin/               # Admin dashboard pages
│   ├── driver/              # Driver-specific pages
│   └── employee/            # Employee pages
├── layouts/                 # Layout components by role
├── api/                     # Axios instance
├── services/                # API service layer (one per domain)
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions
```

## Key Technologies

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4 |
| Routing | React Router v7 |
| Maps | Leaflet + React Leaflet |
| State | React Query / Context API |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL + Prisma ORM 7 |
| Auth | JWT, bcrypt, Passport |
| Validation | class-validator, class-transformer |
| Testing | Jest, Supertest |

## Database Schema (Prisma)

Key models and relationships:
- **User** (ADMIN/EMPLOYEE/DRIVER roles) → Driver profile, TransportRequests
- **Vehicle** → Trips, FuelLogs, MaintenanceLogs, IssueReports, assigned Drivers
- **Driver** ↔ User (1:1), ↔ Vehicle (many-to-one)
- **Trip** → Vehicle, Driver, TransportRequest
- **TransportRequest** → User (employee), Trip
- **FuelLog** → Vehicle, Driver
- **MaintenanceLog** → Vehicle
- **VehicleIssueReport** → Vehicle, Driver

Enums: UserRole, UserStatus, VehicleStatus, DriverAvailabilityStatus, TransportRequestStatus, TripStatus, MaintenanceStatus, VehicleIssueStatus

## Development Patterns

### Backend Service Pattern
```typescript
@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}
  
  async findAll() {
    return this.prisma.vehicle.findMany({
      select: { id: true, plateNumber: true, ... }
    });
  }
  
  async findOne(id: number) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { ... }
    });
    if (!vehicle) throw new NotFoundException(...);
    return vehicle;
  }
  
  create(dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({ data: dto, select: {...} });
  }
  
  async update(id: number, dto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.vehicle.update({ where: { id }, data: dto, select: {...} });
  }
  
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.vehicle.delete({ where: { id }, select: {...} });
  }
}
```

### Controller Pattern
```typescript
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}
  
  @Get()
  findAll() { return this.vehiclesService.findAll(); }
  
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }
  
  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }
  
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }
  
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.remove(id);
  }
}
```

### Frontend Service Pattern
```typescript
// client/src/services/vehicle.service.ts
import api from '../api/axios';
import type { Vehicle, CreateVehicleData } from '../types/vehicle';

export async function getVehicles(): Promise<Vehicle[]> {
  const response = await api.get('/vehicles');
  return response.data;
}

export async function createVehicle(data: CreateVehicleData): Promise<Vehicle> {
  const response = await api.post('/vehicles', data);
  return response.data;
}
```

### Frontend Component Pattern
```typescript
// Role-based route protection
<Route
  path="/admin"
  element={
    <RoleRoute allowedRole="ADMIN">
      <DashboardLayout />
    </RoleRoute>
  }
>
  <Route index element={<DashboardHome />} />
  <Route path="vehicles" element={<VehiclesView />} />
</Route>
```

## Authentication & Authorization

- **JWT-based authentication** with access tokens
- **Role-based access control**: ADMIN, DRIVER, EMPLOYEE
- **Route protection**: `RoleRoute` component wraps layouts
- **API base URL**: Configured in `client/src/api/axios.ts` (currently points to Render deployment)

## Key Files to Know

- `server/prisma/schema.prisma` - Database schema
- `server/src/main.ts` - App bootstrap, CORS, validation pipes
- `server/src/app.module.ts` - Root module imports all domain modules
- `client/src/App.tsx` - Main routing with role-based protection
- `client/src/api/axios.ts` - Axios instance configuration
- `client/src/layouts/*.tsx` - Role-specific layouts with navigation

## Testing

- **Unit tests**: `*.spec.ts` alongside source files (Jest)
- **E2E tests**: `server/test/` directory with separate Jest config
- **Coverage**: `npm run test:cov` in server/

## Environment

- **Database**: PostgreSQL (configured via `server/.env`)
- **Frontend dev server**: Vite on port 5173
- **Backend dev server**: NestJS on port 3000 (default)

## Recent Changes

- Added `receiptPhoto` field to FuelLog model (migration 20260819105915)
- Fuel logs and maintenance logs are fully implemented with CRUD operations
- Map integration for route visualization using Leaflet