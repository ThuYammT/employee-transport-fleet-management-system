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

import { FuelLogsService } from './fuel-logs.service'
import { CreateFuelLogDto } from './dto/create-fuel-log.dto'
import { UpdateFuelLogDto } from './dto/update-fuel-log.dto'

@Controller('fuel-logs')
export class FuelLogsController {
  constructor(
    private readonly fuelLogsService: FuelLogsService,
  ) {}

  @Get()
  findAll() {
    return this.fuelLogsService.findAll()
  }

  @Get('driver/:driverId')
  findByDriverId(
    @Param('driverId', ParseIntPipe)
    driverId: number,
  ) {
    return this.fuelLogsService.findByDriverId(
      driverId,
    )
  }

  @Get('vehicle/:vehicleId')
  findByVehicleId(
    @Param('vehicleId', ParseIntPipe)
    vehicleId: number,
  ) {
    return this.fuelLogsService.findByVehicleId(
      vehicleId,
    )
  }

  @Get('trip/:tripId')
  findByTripId(
    @Param('tripId', ParseIntPipe)
    tripId: number,
  ) {
    return this.fuelLogsService.findByTripId(
      tripId,
    )
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.fuelLogsService.findOne(id)
  }

  @Post()
  create(
    @Body()
    createFuelLogDto: CreateFuelLogDto,
  ) {
    return this.fuelLogsService.create(
      createFuelLogDto,
    )
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    updateFuelLogDto: UpdateFuelLogDto,
  ) {
    return this.fuelLogsService.update(
      id,
      updateFuelLogDto,
    )
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.fuelLogsService.remove(id)
  }
}