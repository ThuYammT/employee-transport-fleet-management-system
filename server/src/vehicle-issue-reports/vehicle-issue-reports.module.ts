import { Module } from '@nestjs/common'
import { VehicleIssueReportsService } from './vehicle-issue-reports.service'
import { VehicleIssueReportsController } from './vehicle-issue-reports.controller'

@Module({
  controllers: [VehicleIssueReportsController],
  providers: [VehicleIssueReportsService],
})
export class VehicleIssueReportsModule {}