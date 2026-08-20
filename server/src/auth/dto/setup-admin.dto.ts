import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class SetupAdminDto {
  @IsString()
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
  @MinLength(16, {
    message: 'Setup key must contain at least 16 characters',
  })
  setupKey: string
}