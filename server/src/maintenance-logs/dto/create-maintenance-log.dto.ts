import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class CreateMaintenanceLogDto {
  @IsInt()
  vehicleId: number

  @IsDateString()
  serviceDate: string

  @IsString()
  @IsNotEmpty()
  description: string

  @IsNumber()
  @Min(0)
  cost: number

  @IsOptional()
  @IsDateString()
  nextServiceDate?: string
}