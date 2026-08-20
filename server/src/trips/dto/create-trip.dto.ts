import { IsInt } from 'class-validator'

export class CreateTripDto {
  @IsInt()
  requestId: number

  @IsInt()
  driverId: number

  @IsInt()
  vehicleId: number
}