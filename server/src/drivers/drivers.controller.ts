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

import { DriversService } from './drivers.service'
import { CreateDriverDto } from './dto/create-driver.dto'
import { UpdateDriverDto } from './dto/update-driver.dto'

@Controller('drivers')
export class DriversController {
  constructor(
    private readonly driversService: DriversService,
  ) {}

  @Get()
  findAll() {
    return this.driversService.findAll()
  }

  @Get('user/:userId')
  findByUserId(
    @Param('userId', ParseIntPipe)
    userId: number,
  ) {
    return this.driversService.findByUserId(userId)
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.driversService.findOne(id)
  }

  @Post()
  create(
    @Body()
    createDriverDto: CreateDriverDto,
  ) {
    return this.driversService.create(
      createDriverDto,
    )
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    updateDriverDto: UpdateDriverDto,
  ) {
    return this.driversService.update(
      id,
      updateDriverDto,
    )
  }

  @Delete(':id')
  deactivate(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.driversService.deactivate(id)
  }
}