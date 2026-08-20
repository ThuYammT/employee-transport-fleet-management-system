import {
  IsDateString,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator'

export class CreateTransportRequestDto {
  @IsInt()
  employeeId: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  pickupLocation: string

  @IsOptional()
  @IsLatitude()
  pickupLatitude?: number

  @IsOptional()
  @IsLongitude()
  pickupLongitude?: number

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  destination: string

  @IsOptional()
  @IsLatitude()
  destinationLatitude?: number

  @IsOptional()
  @IsLongitude()
  destinationLongitude?: number

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedDistanceKm?: number

  @IsOptional()
  @IsInt()
  @IsPositive()
  estimatedDurationMinutes?: number

  @IsDateString()
  requestDate: string

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'requestTime must use HH:mm format',
  })
  requestTime: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  purpose: string
}