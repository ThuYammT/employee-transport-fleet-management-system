import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  AuditAction,
  Prisma,
} from '@prisma/client'

import {
  PrismaService,
} from '../prisma/prisma.service'

type CreateAuditLogData = {
  actorUserId?: number | null
  targetUserId?: number | null
  action: AuditAction
  description: string
  ipAddress?: string | null
  userAgent?: string | null
}

type FindAuditLogsOptions = {
  page?: number
  limit?: number
  action?: AuditAction
  search?: string
}

@Injectable()
export class AuditLogsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(
    data: CreateAuditLogData,
  ) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId:
          data.actorUserId ?? null,

        targetUserId:
          data.targetUserId ?? null,

        action:
          data.action,

        description:
          data.description,

        ipAddress:
          data.ipAddress ?? null,

        userAgent:
          data.userAgent ?? null,
      },

      include: {
        actorUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },

        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    })
  }

  async findAll(
    options: FindAuditLogsOptions = {},
  ) {
    const page =
      Math.max(
        1,
        options.page ?? 1,
      )

    const requestedLimit =
      options.limit ?? 20

    /*
     * Prevent someone from requesting
     * thousands of rows at once.
     */
    const limit =
      Math.min(
        Math.max(
          1,
          requestedLimit,
        ),
        100,
      )

    const skip =
      (page - 1) * limit

    const search =
      options.search
        ?.trim() ?? ''

    const where:
      Prisma.AuditLogWhereInput =
      {}

    if (
      options.action
    ) {
      where.action =
        options.action
    }

    if (search) {
      where.OR = [
        {
          description: {
            contains:
              search,

            mode:
              'insensitive',
          },
        },

        {
          ipAddress: {
            contains:
              search,

            mode:
              'insensitive',
          },
        },

        {
          actorUser: {
            is: {
              OR: [
                {
                  name: {
                    contains:
                      search,

                    mode:
                      'insensitive',
                  },
                },

                {
                  email: {
                    contains:
                      search,

                    mode:
                      'insensitive',
                  },
                },
              ],
            },
          },
        },

        {
          targetUser: {
            is: {
              OR: [
                {
                  name: {
                    contains:
                      search,

                    mode:
                      'insensitive',
                  },
                },

                {
                  email: {
                    contains:
                      search,

                    mode:
                      'insensitive',
                  },
                },
              ],
            },
          },
        },
      ]
    }

    const [
      data,
      total,
    ] =
      await this.prisma.$transaction([
        this.prisma.auditLog.findMany({
          where,

          include: {
            actorUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
              },
            },

            targetUser: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
              },
            },
          },

          orderBy: {
            createdAt:
              'desc',
          },

          skip,
          take: limit,
        }),

        this.prisma.auditLog.count({
          where,
        }),
      ])

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          total / limit,
        ),
      )

    return {
      data,

      pagination: {
        page,
        limit,
        total,
        totalPages,

        hasPreviousPage:
          page > 1,

        hasNextPage:
          page <
          totalPages,
      },
    }
  }

  async findOne(
    id: number,
  ) {
    const auditLog =
      await this.prisma.auditLog.findUnique({
        where: {
          id,
        },

        include: {
          actorUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },

          targetUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      })

    if (!auditLog) {
      throw new NotFoundException(
        `Audit log with ID ${id} not found`,
      )
    }

    return auditLog
  }
}