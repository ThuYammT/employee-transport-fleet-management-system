import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  ParseIntPipe,
} from '@nestjs/common'
import { VehicleIssueReportsService } from './vehicle-issue-reports.service'
import { CreateVehicleIssueReportDto } from './dto/create-vehicle-issue-report.dto'
import { UpdateVehicleIssueReportDto } from './dto/update-vehicle-issue-report.dto'

@Controller('vehicle-issue-reports')
export class VehicleIssueReportsController {
  constructor(
    private readonly vehicleIssueReportsService: VehicleIssueReportsService,
  ) {}

  @Get()
  findAll() {
    return this.vehicleIssueReportsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleIssueReportsService.findOne(id)
  }

  @Post()
  create(@Body() createDto: CreateVehicleIssueReportDto) {
    return this.vehicleIssueReportsService.create(createDto)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateVehicleIssueReportDto,
  ) {
    return this.vehicleIssueReportsService.update(id, updateDto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleIssueReportsService.remove(id)
  }
}