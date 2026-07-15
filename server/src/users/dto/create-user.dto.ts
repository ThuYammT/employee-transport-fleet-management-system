import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'
import { UserRole } from '@prisma/client'

export class CreateUserDto {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8, {
    message: 'Password must contain at least 8 characters',
  })
  password: string

  @IsEnum(UserRole)
  role: UserRole

  @IsOptional()
  @IsString()
  phone?: string
}