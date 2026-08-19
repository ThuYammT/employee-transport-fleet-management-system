import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator'

export class CreateFuelLogDto {
  @IsInt()
  @Min(1)
  vehicleId: number

  @IsInt()
  @Min(1)
  driverId: number

  @IsOptional()
  @IsInt()
  @Min(1)
  tripId?: number

  @IsDateString()
  fuelDate: string

  @IsNumber()
  @Min(0.1)
  liters: number

  @IsNumber()
  @Min(0)
  cost: number

  @IsOptional()
  @IsString()
  fuelStation?: string

  @IsOptional()
  @IsString()
  photoUrl?: string
}