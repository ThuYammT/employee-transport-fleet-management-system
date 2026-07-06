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
  vehicleId: number

  @IsInt()
  driverId: number

  @IsOptional()
  @IsInt()
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