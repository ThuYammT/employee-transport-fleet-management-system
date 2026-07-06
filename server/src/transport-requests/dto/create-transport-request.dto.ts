import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsString,
} from 'class-validator'

export class CreateTransportRequestDto {
  @IsInt()
  employeeId: number

  @IsString()
  @IsNotEmpty()
  pickupLocation: string

  @IsString()
  @IsNotEmpty()
  destination: string

  @IsDateString()
  requestDate: string

  @IsString()
  @IsNotEmpty()
  requestTime: string

  @IsString()
  @IsNotEmpty()
  purpose: string
}