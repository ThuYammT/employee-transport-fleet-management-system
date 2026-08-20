import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common'

import { CreateTransportRequestDto } from './dto/create-transport-request.dto'
import { EstimateRouteDto } from './dto/estimate-route.dto'
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto'
import { SearchLocationDto } from './dto/search-location.dto'
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto'
import { TransportRequestsService } from './transport-requests.service'

@Controller('transport-requests')
export class TransportRequestsController {
  constructor(
    private readonly transportRequestsService: TransportRequestsService,
  ) {}

  /*
   * Keep these static routes above @Get(':id').
   * Otherwise NestJS may treat "location-search"
   * or "reverse-geocode" as an ID.
   */

  @Get('location-search')
  searchLocations(
    @Query() queryDto: SearchLocationDto,
  ) {
    return this.transportRequestsService.searchLocations(
      queryDto,
    )
  }

  @Get('reverse-geocode')
  reverseGeocode(
    @Query() queryDto: ReverseGeocodeDto,
  ) {
    return this.transportRequestsService.reverseGeocode(
      queryDto,
    )
  }

  @Post('estimate-route')
  estimateRoute(
    @Body() estimateRouteDto: EstimateRouteDto,
  ) {
    return this.transportRequestsService.estimateRoute(
      estimateRouteDto,
    )
  }

  @Get()
  findAll() {
    return this.transportRequestsService.findAll()
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transportRequestsService.findOne(id)
  }

  @Post()
  create(
    @Body()
    createDto: CreateTransportRequestDto,
  ) {
    return this.transportRequestsService.create(
      createDto,
    )
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,

    @Body()
    updateDto: UpdateTransportRequestDto,
  ) {
    return this.transportRequestsService.update(
      id,
      updateDto,
    )
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.transportRequestsService.remove(id)
  }
}