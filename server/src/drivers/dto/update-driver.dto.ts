import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class UpdateDriverDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(8, {
    message: 'Password must contain at least 8 characters',
  })
  password?: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  licenseNumber?: string

  @IsOptional()
  @IsInt()
  assignedVehicleId?: number | null
}