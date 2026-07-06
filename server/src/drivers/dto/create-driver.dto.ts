import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateDriverDto {
  @IsInt()
  userId: number

  @IsString()
  @IsNotEmpty()
  licenseNumber: string

  @IsOptional()
  @IsInt()
  assignedVehicleId?: number
}