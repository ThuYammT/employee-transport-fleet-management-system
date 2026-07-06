import { IsInt, IsNotEmpty, IsString } from 'class-validator'

export class CreateVehicleIssueReportDto {
  @IsInt()
  vehicleId: number

  @IsInt()
  driverId: number

  @IsString()
  @IsNotEmpty()
  issueTitle: string

  @IsString()
  @IsNotEmpty()
  description: string
}