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
import { TransportRequestsService } from './transport-requests.service'
import { CreateTransportRequestDto } from './dto/create-transport-request.dto'
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto'

@Controller('transport-requests')
export class TransportRequestsController {
  constructor(
    private readonly transportRequestsService: TransportRequestsService,
  ) {}

  @Get()
  findAll() {
    return this.transportRequestsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transportRequestsService.findOne(id)
  }

  @Post()
  create(@Body() createDto: CreateTransportRequestDto) {
    return this.transportRequestsService.create(createDto)
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTransportRequestDto,
  ) {
    return this.transportRequestsService.update(id, updateDto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transportRequestsService.remove(id)
  }
}