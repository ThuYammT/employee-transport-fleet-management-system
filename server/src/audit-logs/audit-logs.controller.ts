import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common'

import {
  AuditAction,
} from '@prisma/client'

import {
  AuditLogsService,
} from './audit-logs.service'

@Controller('audit-logs')
export class AuditLogsController {
  constructor(
    private readonly auditLogsService:
      AuditLogsService,
  ) {}

  @Get()
  findAll(
    @Query('page')
    page?: string,

    @Query('limit')
    limit?: string,

    @Query('action')
    action?: string,

    @Query('search')
    search?: string,
  ) {
    const parsedPage =
      page
        ? Number(page)
        : 1

    const parsedLimit =
      limit
        ? Number(limit)
        : 20

    if (
      !Number.isInteger(
        parsedPage,
      ) ||
      parsedPage < 1
    ) {
      throw new BadRequestException(
        'Page must be a positive integer',
      )
    }

    if (
      !Number.isInteger(
        parsedLimit,
      ) ||
      parsedLimit < 1
    ) {
      throw new BadRequestException(
        'Limit must be a positive integer',
      )
    }

    let auditAction:
      AuditAction | undefined

    if (
      action &&
      action !== 'ALL'
    ) {
      if (
        !Object.values(
          AuditAction,
        ).includes(
          action as AuditAction,
        )
      ) {
        throw new BadRequestException(
          'Invalid audit action',
        )
      }

      auditAction =
        action as AuditAction
    }

    return this.auditLogsService.findAll({
      page:
        parsedPage,

      limit:
        parsedLimit,

      action:
        auditAction,

      search,
    })
  }

  @Get(':id')
  findOne(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.auditLogsService.findOne(
      id,
    )
  }
}