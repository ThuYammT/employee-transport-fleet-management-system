import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class UpdateFuelLogDto {
  @IsOptional()
  @IsDateString()
  fuelDate?: string

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  liters?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number

  @IsOptional()
  @IsString()
  photoUrl?: string
}