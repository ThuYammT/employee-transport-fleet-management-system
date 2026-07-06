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
import { MaintenanceLogsService } from './maintenance-logs.service'
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto'
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto'

@Controller('maintenance-logs')
export class MaintenanceLogsController {
  constructor(
    private readonly maintenanceLogsService: MaintenanceLogsService,
  ) {}

  @Get()
  findAll() {
    return this.maintenanceLogsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceLogsService.findOne(id)
  }

  @Post()
  create(@Body() createMaintenanceLogDto: CreateMaintenanceLogDto) {
    return this.maintenanceLogsService.create(createMaintenanceLogDto)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMaintenanceLogDto: UpdateMaintenanceLogDto,
  ) {
    return this.maintenanceLogsService.update(id, updateMaintenanceLogDto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.maintenanceLogsService.remove(id)
  }
}