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
import { FuelLogsService } from './fuel-logs.service'
import { CreateFuelLogDto } from './dto/create-fuel-log.dto'
import { UpdateFuelLogDto } from './dto/update-fuel-log.dto'

@Controller('fuel-logs')
export class FuelLogsController {
  constructor(private readonly fuelLogsService: FuelLogsService) {}

  @Get()
  findAll() {
    return this.fuelLogsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fuelLogsService.findOne(id)
  }

  @Post()
  create(@Body() createFuelLogDto: CreateFuelLogDto) {
    return this.fuelLogsService.create(createFuelLogDto)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFuelLogDto: UpdateFuelLogDto,
  ) {
    return this.fuelLogsService.update(id, updateFuelLogDto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fuelLogsService.remove(id)
  }
}