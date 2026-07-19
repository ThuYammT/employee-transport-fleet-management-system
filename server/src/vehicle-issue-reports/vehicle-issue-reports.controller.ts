import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common'

import {
  VehicleIssueReportsService,
} from './vehicle-issue-reports.service'

import {
  CreateVehicleIssueReportDto,
} from './dto/create-vehicle-issue-report.dto'

import {
  UpdateVehicleIssueReportDto,
} from './dto/update-vehicle-issue-report.dto'

@Controller('vehicle-issue-reports')
export class VehicleIssueReportsController {
  constructor(
    private readonly vehicleIssueReportsService:
      VehicleIssueReportsService,
  ) {}

  @Get()
  findAll() {
    return this.vehicleIssueReportsService.findAll()
  }

  @Get('driver/:driverId')
  findByDriverId(
    @Param('driverId', ParseIntPipe)
    driverId: number,
  ) {
    return this.vehicleIssueReportsService
      .findByDriverId(driverId)
  }

  @Get('vehicle/:vehicleId')
  findByVehicleId(
    @Param('vehicleId', ParseIntPipe)
    vehicleId: number,
  ) {
    return this.vehicleIssueReportsService
      .findByVehicleId(vehicleId)
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.vehicleIssueReportsService
      .findOne(id)
  }

  @Post()
  create(
    @Body()
    createDto:
      CreateVehicleIssueReportDto,
  ) {
    return this.vehicleIssueReportsService
      .create(createDto)
  }

  @Patch(':id/start')
  startInvestigation(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.vehicleIssueReportsService
      .startInvestigation(id)
  }

  @Patch(':id/resolve')
  resolve(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.vehicleIssueReportsService
      .resolve(id)
  }

  @Patch(':id/reopen')
  reopen(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.vehicleIssueReportsService
      .reopen(id)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    updateDto:
      UpdateVehicleIssueReportDto,
  ) {
    return this.vehicleIssueReportsService
      .update(id, updateDto)
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.vehicleIssueReportsService
      .remove(id)
  }
}