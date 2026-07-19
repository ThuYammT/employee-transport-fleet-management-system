import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class UpdateMaintenanceLogDto {
  @IsOptional()
  @IsDateString()
  serviceDate?: string

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number

  @IsOptional()
  @IsDateString()
  nextServiceDate?: string | null
}