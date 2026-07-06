import { PartialType } from '@nestjs/mapped-types'
import { IsEnum, IsOptional } from 'class-validator'
import { VehicleIssueStatus } from '@prisma/client'
import { CreateVehicleIssueReportDto } from './create-vehicle-issue-report.dto'

export class UpdateVehicleIssueReportDto extends PartialType(
  CreateVehicleIssueReportDto,
) {
  @IsOptional()
  @IsEnum(VehicleIssueStatus)
  status?: VehicleIssueStatus
}