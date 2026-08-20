import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator'

export class CreateVehicleDto {
  @IsString()
  @IsNotEmpty()
  plateNumber: string

  @IsString()
  @IsNotEmpty()
  vehicleType: string

  @IsInt()
  @Min(1)
  capacity: number
}