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

### Frontend (React) - Feature-Based Structure
```
client/src/
├── components/              # Reusable UI components
├── pages/                   # Page components by role
│   ├── admin/               # Admin dashboard pages
│   ├── driver/              # Driver-specific pages
│   └── employee/            # Employee pages
├── layouts/                 # Layout components by role
├── services/                # API service layer (axios)
├── hooks/                   # Custom React hooks
├── context/                 # React context providers
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
  constructor(private vehiclesRepository: VehiclesRepository) {}
  
  async findAvailableVehicles(): Promise<Vehicle[]> {
    return this.vehiclesRepository.findByStatus('AVAILABLE');
  }
}
```

### Controller Pattern
```typescript
@Controller('vehicles')
export class VehiclesController {
  constructor(private vehiclesService: VehiclesService) {}
  
  @Get('available')
  async getAvailableVehicles() {
    return this.vehiclesService.findAvailableVehicles();
  }
}
```

### Frontend Component Pattern
```typescript
export const VehicleList: React.FC = () => {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => api.get('/vehicles/available'),
  });
  
  return (
    <div>
      {vehicles?.map(vehicle => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
};
```

## Testing

- **Unit tests**: `*.spec.ts` alongside source files (Jest)
- **E2E tests**: `test/` directory with separate Jest config
- **Coverage**: `npm run test:cov` in server/

## Environment

- **Database**: PostgreSQL (configured via `server/.env`)
- **Frontend dev server**: Vite on port 5173
- **Backend dev server**: NestJS on port 3000 (default)

## Key Files to Know

- `server/prisma/schema.prisma` - Database schema
- `server/src/main.ts` - App bootstrap
- `server/src/app.module.ts` - Root module
- `client/vite.config.ts` - Vite configuration
- `client/src/services/api.ts` - Axios instance with interceptors