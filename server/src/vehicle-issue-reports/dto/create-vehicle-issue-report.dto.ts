import {
  IsInt,
  IsNotEmpty,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'

export class CreateVehicleIssueReportDto {
  @IsInt()
  @Min(1)
  vehicleId: number

  @IsInt()
  @Min(1)
  driverId: number

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(150)
  issueTitle: string

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(2000)
  description: string
}