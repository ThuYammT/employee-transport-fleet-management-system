import { PartialType } from '@nestjs/mapped-types'
import { IsEnum, IsOptional } from 'class-validator'
import { MaintenanceStatus } from '@prisma/client'
import { CreateMaintenanceLogDto } from './create-maintenance-log.dto'

export class UpdateMaintenanceLogDto extends PartialType(
  CreateMaintenanceLogDto,
) {
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus
}