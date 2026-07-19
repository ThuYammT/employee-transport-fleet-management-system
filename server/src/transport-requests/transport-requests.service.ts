import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { Prisma, TransportRequestStatus } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateTransportRequestDto } from './dto/create-transport-request.dto'
import { EstimateRouteDto } from './dto/estimate-route.dto'
import { SearchLocationDto } from './dto/search-location.dto'
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto'

const ORS_BASE_URL = 'https://api.openrouteservice.org'

const transportRequestInclude = {
  employee: { select: { id: true, name: true, email: true, role: true, phone: true, status: true } },
  trip: {
    include: {
      driver: { include: { user: { select: { id: true, name: true, email: true, phone: true, role: true, status: true } } } },
      vehicle: true,
    },
  },
} satisfies Prisma.TransportRequestInclude

@Injectable()
export class TransportRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.transportRequest.findMany({ include: transportRequestInclude, orderBy: { createdAt: 'desc' } })
  }

  async findOne(id: number) {
    const request = await this.prisma.transportRequest.findUnique({ where: { id }, include: transportRequestInclude })
    if (!request) throw new NotFoundException(`Transport request with ID ${id} was not found`)
    return request
  }

  async searchLocations(dto: SearchLocationDto) {
    const text = dto.query.trim()
    if (text.length < 2) throw new BadRequestException('Enter at least 2 characters')

    const url = new URL(`${ORS_BASE_URL}/geocode/autocomplete`)
    url.searchParams.set('api_key', this.apiKey())
    url.searchParams.set('text', text)
    url.searchParams.set('size', String(dto.limit ?? 6))

    const response = await this.orsFetch(url, { method: 'GET' })
    const data = await response.json() as any

    return (data.features ?? []).map((feature: any) => {
      const [longitude, latitude] = feature.geometry.coordinates
      return {
        id: feature.properties.id ?? `${longitude}-${latitude}`,
        label: feature.properties.label ?? feature.properties.name,
        name: feature.properties.name ?? null,
        locality: feature.properties.locality ?? null,
        region: feature.properties.region ?? null,
        country: feature.properties.country ?? null,
        latitude,
        longitude,
      }
    })
  }

  async estimateRoute(dto: EstimateRouteDto) {
    if (dto.pickupLatitude === dto.destinationLatitude && dto.pickupLongitude === dto.destinationLongitude) {
      throw new BadRequestException('Pickup and destination must be different')
    }

    const response = await this.orsFetch(`${ORS_BASE_URL}/v2/directions/driving-car/geojson`, {
      method: 'POST',
      headers: {
        Authorization: this.apiKey(),
        'Content-Type': 'application/json',
        Accept: 'application/json, application/geo+json',
      },
      body: JSON.stringify({
        coordinates: [
          [dto.pickupLongitude, dto.pickupLatitude],
          [dto.destinationLongitude, dto.destinationLatitude],
        ],
        instructions: false,
      }),
    })

    const data = await response.json() as any
    const feature = data.features?.[0]
    const summary = feature?.properties?.summary
    if (!summary) throw new BadGatewayException('No usable route was returned')

    return {
      distanceMeters: Math.round(summary.distance),
      estimatedDistanceKm: Math.round((summary.distance / 1000) * 100) / 100,
      durationSeconds: Math.round(summary.duration),
      estimatedDurationMinutes: Math.max(1, Math.ceil(summary.duration / 60)),
      routeCoordinates: (feature.geometry?.coordinates ?? []).map(
        ([longitude, latitude]: [number, number]) => [latitude, longitude],
      ),
    }
  }

  async create(dto: CreateTransportRequestDto) {
    const employee = await this.prisma.user.findUnique({ where: { id: dto.employeeId } })
    if (!employee) throw new NotFoundException(`Employee with ID ${dto.employeeId} was not found`)
    if (employee.role !== 'EMPLOYEE') throw new BadRequestException('Selected user is not an employee')
    if (employee.status !== 'ACTIVE') throw new BadRequestException('An inactive employee cannot create a request')

    const coordinates = [dto.pickupLatitude, dto.pickupLongitude, dto.destinationLatitude, dto.destinationLongitude]
    const supplied = coordinates.filter((value) => value !== undefined).length
    if (supplied !== 0 && supplied !== 4) throw new BadRequestException('All four coordinates must be supplied together')

    const route = supplied === 4 ? await this.estimateRoute({
      pickupLatitude: dto.pickupLatitude!,
      pickupLongitude: dto.pickupLongitude!,
      destinationLatitude: dto.destinationLatitude!,
      destinationLongitude: dto.destinationLongitude!,
    }) : null

    return this.prisma.transportRequest.create({
      data: {
        employeeId: dto.employeeId,
        pickupLocation: dto.pickupLocation.trim(),
        pickupLatitude: dto.pickupLatitude,
        pickupLongitude: dto.pickupLongitude,
        destination: dto.destination.trim(),
        destinationLatitude: dto.destinationLatitude,
        destinationLongitude: dto.destinationLongitude,
        estimatedDistanceKm: route?.estimatedDistanceKm,
        estimatedDurationMinutes: route?.estimatedDurationMinutes,
        requestDate: new Date(dto.requestDate),
        requestTime: dto.requestTime,
        purpose: dto.purpose.trim(),
      },
      include: transportRequestInclude,
    })
  }

  async update(id: number, dto: UpdateTransportRequestDto) {
    const existing = await this.findOne(id)
    if (existing.trip && dto.status && dto.status !== TransportRequestStatus.APPROVED) {
      throw new BadRequestException('A request with an assigned trip cannot be rejected or cancelled')
    }

    return this.prisma.transportRequest.update({
      where: { id },
      data: {
        employeeId: dto.employeeId,
        pickupLocation: dto.pickupLocation?.trim(),
        pickupLatitude: dto.pickupLatitude,
        pickupLongitude: dto.pickupLongitude,
        destination: dto.destination?.trim(),
        destinationLatitude: dto.destinationLatitude,
        destinationLongitude: dto.destinationLongitude,
        requestDate: dto.requestDate ? new Date(dto.requestDate) : undefined,
        requestTime: dto.requestTime,
        purpose: dto.purpose?.trim(),
        status: dto.status,
      },
      include: transportRequestInclude,
    })
  }

  async remove(id: number) {
    const request = await this.findOne(id)
    if (request.trip) throw new BadRequestException('A request with an assigned trip cannot be deleted')
    return this.prisma.transportRequest.delete({ where: { id } })
  }

  private apiKey() {
    const key = process.env.OPENROUTESERVICE_API_KEY?.trim()
    if (!key) throw new InternalServerErrorException('OPENROUTESERVICE_API_KEY is not configured')
    return key
  }

  private async orsFetch(input: string | URL, init: RequestInit) {
    let response: Response
    try { response = await fetch(input, init) }
    catch { throw new BadGatewayException('Could not connect to openrouteservice') }

    if (!response.ok) {
      const detail = await response.text()
      console.error(`openrouteservice ${response.status}: ${detail}`)
      if (response.status === 429) throw new BadGatewayException('Free route-service limit reached; try later')
      if (response.status === 401 || response.status === 403) throw new BadGatewayException('Invalid openrouteservice API key')
      throw new BadGatewayException('Route service could not complete the request')
    }
    return response
  }
}
