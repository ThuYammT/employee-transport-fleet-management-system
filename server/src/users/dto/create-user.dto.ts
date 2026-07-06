import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator'
import { UserRole } from '@prisma/client'

export class CreateUserDto {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsString()
  password: string

  @IsEnum(UserRole)
  role: UserRole

  @IsOptional()
  @IsString()
  phone?: string
}