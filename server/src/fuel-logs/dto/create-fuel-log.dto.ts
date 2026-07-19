import {
  IsDateString,
  IsInt,
  IsNotEmpty,
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

  @IsInt()
  @Min(0)
  mileage: number

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fuelStation?: string
}