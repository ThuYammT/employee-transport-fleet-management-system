import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'
import {
  VehicleIssueStatus,
} from '@prisma/client'

export class UpdateVehicleIssueReportDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  issueTitle?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsEnum(VehicleIssueStatus)
  status?: VehicleIssueStatus
}