import { Transform } from 'class-transformer'
import {
  IsLatitude,
  IsLongitude,
} from 'class-validator'

export class ReverseGeocodeDto {
  @Transform(({ value }) => Number(value))
  @IsLatitude()
  latitude: number

  @Transform(({ value }) => Number(value))
  @IsLongitude()
  longitude: number
}