import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common'
import { CreateTransportRequestDto } from './dto/create-transport-request.dto'
import { EstimateRouteDto } from './dto/estimate-route.dto'
import { SearchLocationDto } from './dto/search-location.dto'
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto'
import { TransportRequestsService } from './transport-requests.service'

@Controller('transport-requests')
export class TransportRequestsController {
  constructor(private readonly transportRequestsService: TransportRequestsService) {}

  @Get('location-search')
  searchLocations(@Query() dto: SearchLocationDto) {
    return this.transportRequestsService.searchLocations(dto)
  }

  @Post('estimate-route')
  estimateRoute(@Body() dto: EstimateRouteDto) {
    return this.transportRequestsService.estimateRoute(dto)
  }

  @Get()
  findAll() { return this.transportRequestsService.findAll() }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transportRequestsService.findOne(id)
  }

  @Post()
  create(@Body() dto: CreateTransportRequestDto) {
    return this.transportRequestsService.create(dto)
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTransportRequestDto) {
    return this.transportRequestsService.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transportRequestsService.remove(id)
  }
}
