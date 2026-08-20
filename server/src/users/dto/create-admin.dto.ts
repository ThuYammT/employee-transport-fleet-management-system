import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator'

export class CreateAdminDto {
  @IsString()
  name: string

  @IsEmail()
  email: string

  @IsString()
  @MinLength(8, {
    message:
      'Password must contain at least 8 characters',
  })
  password: string

  @IsOptional()
  @IsString()
  phone?: string

  @IsInt()
  @Min(1)
  actorUserId: number
}