import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class CreateMaintenanceLogDto {
  @IsInt()
  @Min(1)
  vehicleId: number

  @IsDateString()
  serviceDate: string

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  description: string

  @IsNumber()
  @Min(0)
  cost: number

  @IsOptional()
  @IsDateString()
  nextServiceDate?: string
}