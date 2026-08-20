import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator'

export class RegisterDto {
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
}