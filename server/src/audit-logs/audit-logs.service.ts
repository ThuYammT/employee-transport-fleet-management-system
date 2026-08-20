import {
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  AuditAction,
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

  findAll() {
    return this.prisma.auditLog.findMany({
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
        createdAt: 'desc',
      },
    })
  }

  async findOne(id: number) {
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