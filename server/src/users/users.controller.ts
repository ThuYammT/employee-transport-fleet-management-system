import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common'

import {
  AuditActorDto,
} from './dto/audit-actor.dto'

import {
  CreateAdminDto,
} from './dto/create-admin.dto'

import {
  CreateUserDto,
} from './dto/create-user.dto'

import {
  UpdateUserDto,
} from './dto/update-user.dto'

import {
  UsersService,
} from './users.service'

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService:
      UsersService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll()
  }

  /*
   * IMPORTANT:
   * Keep static routes above
   * @Get(':id').
   */

  @Post('admin')
  createAdmin(
    @Body()
    createAdminDto:
      CreateAdminDto,
  ) {
    return this.usersService.createAdmin(
      createAdminDto,
    )
  }

  @Patch(':id/activate')
  activate(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    auditActorDto:
      AuditActorDto,
  ) {
    return this.usersService.activate(
      id,
      auditActorDto.actorUserId,
    )
  }

  @Patch(':id/deactivate')
  deactivate(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    auditActorDto:
      AuditActorDto,
  ) {
    return this.usersService.deactivate(
      id,
      auditActorDto.actorUserId,
    )
  }

  @Get(':id')
  findOne(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.usersService.findOne(
      id,
    )
  }

  @Post()
  create(
    @Body()
    createUserDto:
      CreateUserDto,
  ) {
    return this.usersService.create(
      createUserDto,
    )
  }

  @Patch(':id')
  update(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,

    @Body()
    updateUserDto:
      UpdateUserDto,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
    )
  }

  @Delete(':id')
  remove(
    @Param(
      'id',
      ParseIntPipe,
    )
    id: number,
  ) {
    return this.usersService.remove(
      id,
    )
  }
}