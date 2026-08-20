import {
  IsInt,
  Min,
} from 'class-validator'

export class LogoutDto {
  @IsInt()
  @Min(1)
  userId: number
}