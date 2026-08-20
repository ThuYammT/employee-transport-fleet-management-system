import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8, {
    message: 'Password must contain at least 8 characters',
  })
  password: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsString()
  @IsNotEmpty()
  licenseNumber: string

  @IsOptional()
  @IsInt()
  assignedVehicleId?: number
}