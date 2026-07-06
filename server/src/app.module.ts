import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { DriversModule } from './drivers/drivers.module';
import { TransportRequestsModule } from './transport-requests/transport-requests.module';
import { TripsModule } from './trips/trips.module';
import { FuelLogsModule } from './fuel-logs/fuel-logs.module';
import { MaintenanceLogsModule } from './maintenance-logs/maintenance-logs.module';
import { VehicleIssueReportsModule } from './vehicle-issue-reports/vehicle-issue-reports.module';

@Module({
  imports: [PrismaModule, UsersModule, VehiclesModule, DriversModule, TransportRequestsModule, TripsModule, FuelLogsModule, MaintenanceLogsModule, VehicleIssueReportsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
