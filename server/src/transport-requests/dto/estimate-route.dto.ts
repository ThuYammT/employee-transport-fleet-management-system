import { IsLatitude, IsLongitude } from 'class-validator'

export class EstimateRouteDto {
  @IsLatitude()
  pickupLatitude: number

  @IsLongitude()
  pickupLongitude: number

  @IsLatitude()
  destinationLatitude: number

  @IsLongitude()
  destinationLongitude: number
}
