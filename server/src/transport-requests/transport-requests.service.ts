import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'

import {
  Prisma,
  TransportRequestStatus,
} from '@prisma/client'

import { PrismaService } from '../prisma/prisma.service'

import { CreateTransportRequestDto } from './dto/create-transport-request.dto'
import { EstimateRouteDto } from './dto/estimate-route.dto'
import { ReverseGeocodeDto } from './dto/reverse-geocode.dto'
import { SearchLocationDto } from './dto/search-location.dto'
import { UpdateTransportRequestDto } from './dto/update-transport-request.dto'

const ORS_BASE_URL =
  'https://api.openrouteservice.org'

const transportRequestInclude = {
  employee: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      phone: true,
      status: true,
    },
  },

  trip: {
    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              status: true,
            },
          },
        },
      },

      vehicle: true,
    },
  },
} satisfies Prisma.TransportRequestInclude

type OrsGeocodingFeature = {
  geometry?: {
    coordinates?: [number, number]
  }

  properties?: {
    id?: string
    label?: string
    name?: string
    locality?: string
    region?: string
    country?: string
  }
}

type OrsGeocodingResponse = {
  features?: OrsGeocodingFeature[]
}

type OrsRouteResponse = {
  features?: Array<{
    geometry?: {
      coordinates?: Array<
        [number, number]
      >
    }

    properties?: {
      summary?: {
        distance?: number
        duration?: number
      }
    }
  }>
}

type LocationResult = {
  id: string
  label: string
  name: string | null
  locality: string | null
  region: string | null
  country: string | null
  latitude: number
  longitude: number
}

@Injectable()
export class TransportRequestsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  findAll() {
    return this.prisma.transportRequest.findMany({
      include: transportRequestInclude,

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: number) {
    const request =
      await this.prisma.transportRequest.findUnique({
        where: {
          id,
        },

        include: transportRequestInclude,
      })

    if (!request) {
      throw new NotFoundException(
        `Transport request with ID ${id} was not found`,
      )
    }

    return request
  }

  async searchLocations(
    dto: SearchLocationDto,
  ): Promise<LocationResult[]> {
    const text = dto.query.trim()

    if (text.length < 2) {
      throw new BadRequestException(
        'Enter at least 2 characters to search for a location',
      )
    }

    const url = new URL(
      `${ORS_BASE_URL}/geocode/autocomplete`,
    )

    url.searchParams.set(
      'api_key',
      this.getApiKey(),
    )

    url.searchParams.set(
      'text',
      text,
    )

    url.searchParams.set(
      'size',
      String(dto.limit ?? 6),
    )

    const response = await this.fetchOrs(
      url,
      {
        method: 'GET',
      },
    )

    const data =
      (await response.json()) as OrsGeocodingResponse

    const locations: LocationResult[] = []

    for (const feature of data.features ?? []) {
      const location =
        this.mapGeocodingFeature(feature)

      if (location) {
        locations.push(location)
      }
    }

    return locations
  }

  async reverseGeocode(
    dto: ReverseGeocodeDto,
  ): Promise<LocationResult> {
    const url = new URL(
      `${ORS_BASE_URL}/geocode/reverse`,
    )

    url.searchParams.set(
      'api_key',
      this.getApiKey(),
    )

    url.searchParams.set(
      'point.lat',
      String(dto.latitude),
    )

    url.searchParams.set(
      'point.lon',
      String(dto.longitude),
    )

    url.searchParams.set(
      'size',
      '1',
    )

    const response = await this.fetchOrs(
      url,
      {
        method: 'GET',
      },
    )

    const data =
      (await response.json()) as OrsGeocodingResponse

    const feature =
      data.features?.[0]

    if (!feature) {
      return this.createCoordinateFallback(
        dto.latitude,
        dto.longitude,
      )
    }

    const location =
      this.mapGeocodingFeature(feature)

    if (!location) {
      return this.createCoordinateFallback(
        dto.latitude,
        dto.longitude,
      )
    }

    return location
  }

  async estimateRoute(
    dto: EstimateRouteDto,
  ) {
    if (
      dto.pickupLatitude ===
        dto.destinationLatitude &&
      dto.pickupLongitude ===
        dto.destinationLongitude
    ) {
      throw new BadRequestException(
        'Pickup and destination must be different',
      )
    }

    const response = await this.fetchOrs(
      `${ORS_BASE_URL}/v2/directions/driving-car/geojson`,
      {
        method: 'POST',

        headers: {
          Authorization:
            this.getApiKey(),

          'Content-Type':
            'application/json',

          Accept:
            'application/json, application/geo+json',
        },

        body: JSON.stringify({
          coordinates: [
            [
              dto.pickupLongitude,
              dto.pickupLatitude,
            ],

            [
              dto.destinationLongitude,
              dto.destinationLatitude,
            ],
          ],

          instructions: false,
        }),
      },
    )

    const data =
      (await response.json()) as OrsRouteResponse

    const feature =
      data.features?.[0]

    const summary =
      feature?.properties?.summary

    if (
      typeof summary?.distance !==
        'number' ||
      typeof summary.duration !==
        'number'
    ) {
      throw new BadGatewayException(
        'No usable route was returned',
      )
    }

    const distanceMeters =
      Math.round(summary.distance)

    const estimatedDistanceKm =
      Math.round(
        (summary.distance / 1000) *
          100,
      ) / 100

    const estimatedDistanceMiles =
      Math.round(
        (summary.distance / 1609.344) *
          100,
      ) / 100

    const durationSeconds =
      Math.round(summary.duration)

    const estimatedDurationMinutes =
      Math.max(
        1,
        Math.ceil(
          summary.duration / 60,
        ),
      )

    const coordinates =
      feature?.geometry?.coordinates ?? []

    const routeCoordinates: [number, number][] =
      coordinates.map(
        ([longitude, latitude]) => [
          latitude,
          longitude,
        ],
      )

    return {
      distanceMeters,
      estimatedDistanceKm,
      estimatedDistanceMiles,
      durationSeconds,
      estimatedDurationMinutes,
      routeCoordinates,
    }
  }

  async create(
    dto: CreateTransportRequestDto,
  ) {
    const employee =
      await this.prisma.user.findUnique({
        where: {
          id: dto.employeeId,
        },
      })

    if (!employee) {
      throw new NotFoundException(
        `Employee with ID ${dto.employeeId} was not found`,
      )
    }

    if (
      employee.role !== 'EMPLOYEE'
    ) {
      throw new BadRequestException(
        'Selected user is not an employee',
      )
    }

    if (
      employee.status !== 'ACTIVE'
    ) {
      throw new BadRequestException(
        'An inactive employee cannot create a request',
      )
    }

    this.validateCoordinateGroup(dto)

    let routeEstimate:
      | {
          estimatedDistanceKm: number
          estimatedDurationMinutes: number
        }
      | null = null

    if (
      this.hasAllCoordinates(dto)
    ) {
      routeEstimate =
        await this.estimateRoute({
          pickupLatitude:
            dto.pickupLatitude!,

          pickupLongitude:
            dto.pickupLongitude!,

          destinationLatitude:
            dto.destinationLatitude!,

          destinationLongitude:
            dto.destinationLongitude!,
        })
    }

    return this.prisma.transportRequest.create({
      data: {
        employeeId:
          dto.employeeId,

        pickupLocation:
          dto.pickupLocation.trim(),

        pickupLatitude:
          dto.pickupLatitude,

        pickupLongitude:
          dto.pickupLongitude,

        destination:
          dto.destination.trim(),

        destinationLatitude:
          dto.destinationLatitude,

        destinationLongitude:
          dto.destinationLongitude,

        estimatedDistanceKm:
          routeEstimate?.estimatedDistanceKm,

        estimatedDurationMinutes:
          routeEstimate?.estimatedDurationMinutes,

        requestDate:
          new Date(dto.requestDate),

        requestTime:
          dto.requestTime,

        purpose:
          dto.purpose.trim(),
      },

      include:
        transportRequestInclude,
    })
  }

  async update(
    id: number,
    dto: UpdateTransportRequestDto,
  ) {
    const existing =
      await this.findOne(id)

    if (
      existing.trip &&
      dto.status &&
      dto.status !==
        TransportRequestStatus.APPROVED
    ) {
      throw new BadRequestException(
        'A request with an assigned trip cannot be rejected or cancelled',
      )
    }

    if (
      dto.employeeId !== undefined
    ) {
      const employee =
        await this.prisma.user.findUnique({
          where: {
            id: dto.employeeId,
          },
        })

      if (!employee) {
        throw new NotFoundException(
          `Employee with ID ${dto.employeeId} was not found`,
        )
      }

      if (
        employee.role !==
        'EMPLOYEE'
      ) {
        throw new BadRequestException(
          'Selected user is not an employee',
        )
      }
    }

    return this.prisma.transportRequest.update({
      where: {
        id,
      },

      data: {
        employeeId:
          dto.employeeId,

        pickupLocation:
          dto.pickupLocation?.trim(),

        pickupLatitude:
          dto.pickupLatitude,

        pickupLongitude:
          dto.pickupLongitude,

        destination:
          dto.destination?.trim(),

        destinationLatitude:
          dto.destinationLatitude,

        destinationLongitude:
          dto.destinationLongitude,

        estimatedDistanceKm:
          dto.estimatedDistanceKm,

        estimatedDurationMinutes:
          dto.estimatedDurationMinutes,

        requestDate:
          dto.requestDate
            ? new Date(
                dto.requestDate,
              )
            : undefined,

        requestTime:
          dto.requestTime,

        purpose:
          dto.purpose?.trim(),

        status:
          dto.status,
      },

      include:
        transportRequestInclude,
    })
  }

  async remove(id: number) {
    const request =
      await this.findOne(id)

    if (request.trip) {
      throw new BadRequestException(
        'A request with an assigned trip cannot be deleted',
      )
    }

    return this.prisma.transportRequest.delete({
      where: {
        id,
      },
    })
  }

  private mapGeocodingFeature(
    feature: OrsGeocodingFeature,
  ): LocationResult | null {
    const coordinates =
      feature.geometry?.coordinates

    if (
      !coordinates ||
      coordinates.length < 2
    ) {
      return null
    }

    const [
      longitude,
      latitude,
    ] = coordinates

    const properties =
      feature.properties

    return {
      id:
        properties?.id ??
        `${longitude.toFixed(
          6,
        )}-${latitude.toFixed(6)}`,

      label:
        properties?.label ??
        properties?.name ??
        `${latitude.toFixed(
          6,
        )}, ${longitude.toFixed(6)}`,

      name:
        properties?.name ??
        null,

      locality:
        properties?.locality ??
        null,

      region:
        properties?.region ??
        null,

      country:
        properties?.country ??
        null,

      latitude,
      longitude,
    }
  }

  private createCoordinateFallback(
    latitude: number,
    longitude: number,
  ): LocationResult {
    return {
      id: `${longitude.toFixed(
        6,
      )}-${latitude.toFixed(6)}`,

      label: `${latitude.toFixed(
        6,
      )}, ${longitude.toFixed(6)}`,

      name: null,
      locality: null,
      region: null,
      country: null,

      latitude,
      longitude,
    }
  }

  private hasAllCoordinates(
    dto: Partial<CreateTransportRequestDto>,
  ): boolean {
    return (
      dto.pickupLatitude !==
        undefined &&
      dto.pickupLongitude !==
        undefined &&
      dto.destinationLatitude !==
        undefined &&
      dto.destinationLongitude !==
        undefined
    )
  }

  private validateCoordinateGroup(
    dto: Partial<CreateTransportRequestDto>,
  ): void {
    const coordinates = [
      dto.pickupLatitude,
      dto.pickupLongitude,
      dto.destinationLatitude,
      dto.destinationLongitude,
    ]

    const suppliedCount =
      coordinates.filter(
        (value) =>
          value !== undefined,
      ).length

    if (
      suppliedCount !== 0 &&
      suppliedCount !== 4
    ) {
      throw new BadRequestException(
        'All four coordinates must be supplied together',
      )
    }
  }

  private getApiKey(): string {
    const key =
      process.env
        .OPENROUTESERVICE_API_KEY
        ?.trim()

    if (!key) {
      throw new InternalServerErrorException(
        'OPENROUTESERVICE_API_KEY is not configured',
      )
    }

    return key
  }

  private async fetchOrs(
    input: string | URL,
    init: RequestInit,
  ): Promise<Response> {
    let response: Response

    try {
      response = await fetch(
        input,
        init,
      )
    } catch (error) {
      console.error(error)

      throw new BadGatewayException(
        'Could not connect to openrouteservice',
      )
    }

    if (!response.ok) {
      const detail =
        await response.text()

      console.error(
        `openrouteservice ${response.status}: ${detail}`,
      )

      if (
        response.status === 429
      ) {
        throw new BadGatewayException(
          'Free route-service limit reached. Please try again later.',
        )
      }

      if (
        response.status === 401 ||
        response.status === 403
      ) {
        throw new BadGatewayException(
          'Invalid openrouteservice API key',
        )
      }

      throw new BadGatewayException(
        'Route service could not complete the request',
      )
    }

    return response
  }
}