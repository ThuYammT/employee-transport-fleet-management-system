import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import {
  AuditAction,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client'

import * as bcrypt from 'bcrypt'

import {
  AuditLogsService,
} from '../audit-logs/audit-logs.service'

import {
  PrismaService,
} from '../prisma/prisma.service'

import {
  CreateAdminDto,
} from './dto/create-admin.dto'

import {
  CreateUserDto,
} from './dto/create-user.dto'

import {
  UpdateUserDto,
} from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly auditLogsService:
      AuditLogsService,
  ) {}

  findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  async findOne(
    id: number,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

    if (!user) {
      throw new NotFoundException(
        `User with ID ${id} not found`,
      )
    }

    return user
  }

  async create(
    createUserDto:
      CreateUserDto,
  ) {
    const normalizedEmail =
      createUserDto.email
        .trim()
        .toLowerCase()

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email:
            normalizedEmail,
        },
      })

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists',
      )
    }

    const passwordHash =
      await bcrypt.hash(
        createUserDto.password,
        12,
      )

    try {
      const user =
        await this.prisma.user.create({
          data: {
            name:
              createUserDto.name.trim(),

            email:
              normalizedEmail,

            passwordHash,

            role:
              createUserDto.role,

            phone:
              createUserDto.phone
                ?.trim() ||
              null,

            status:
              UserStatus.ACTIVE,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        })

      await this.safeCreateAuditLog({
        actorUserId:
          user.id,

        targetUserId:
          user.id,

        action:
          AuditAction.ACCOUNT_CREATED,

        description:
          `${user.name} account was created.`,
      })

      return user
    } catch (error) {
      this.handleDuplicateEmailError(
        error,
      )

      throw error
    }
  }

  async createAdmin(
    createAdminDto:
      CreateAdminDto,
  ) {
    const actor =
      await this.requireAdmin(
        createAdminDto.actorUserId,
      )

    const normalizedEmail =
      createAdminDto.email
        .trim()
        .toLowerCase()

    const existingUser =
      await this.prisma.user.findUnique({
        where: {
          email:
            normalizedEmail,
        },
      })

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists',
      )
    }

    const passwordHash =
      await bcrypt.hash(
        createAdminDto.password,
        12,
      )

    try {
      const admin =
        await this.prisma.user.create({
          data: {
            name:
              createAdminDto.name.trim(),

            email:
              normalizedEmail,

            passwordHash,

            role:
              UserRole.ADMIN,

            phone:
              createAdminDto.phone
                ?.trim() ||
              null,

            status:
              UserStatus.ACTIVE,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        })

      await this.safeCreateAuditLog({
        actorUserId:
          actor.id,

        targetUserId:
          admin.id,

        action:
          AuditAction.ADMIN_CREATED,

        description:
          `${actor.name} created administrator account ${admin.name}.`,
      })

      return admin
    } catch (error) {
      this.handleDuplicateEmailError(
        error,
      )

      throw error
    }
  }

  async update(
    id: number,
    updateUserDto:
      UpdateUserDto,
  ) {
    const existingUser =
      await this.findOne(id)

    const updateData:
      Prisma.UserUpdateInput = {}

    if (
      updateUserDto.name !==
      undefined
    ) {
      updateData.name =
        updateUserDto.name.trim()
    }

    if (
      updateUserDto.email !==
      undefined
    ) {
      updateData.email =
        updateUserDto.email
          .trim()
          .toLowerCase()
    }

    if (
      updateUserDto.role !==
      undefined
    ) {
      updateData.role =
        updateUserDto.role
    }

    if (
      updateUserDto.phone !==
      undefined
    ) {
      updateData.phone =
        updateUserDto.phone.trim() ||
        null
    }

    if (
      updateUserDto.password !==
      undefined
    ) {
      updateData.passwordHash =
        await bcrypt.hash(
          updateUserDto.password,
          12,
        )
    }

    try {
      const updatedUser =
        await this.prisma.user.update({
          where: {
            id,
          },

          data:
            updateData,

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        })

      await this.safeCreateAuditLog({
        targetUserId:
          updatedUser.id,

        action:
          AuditAction.ACCOUNT_UPDATED,

        description:
          `${existingUser.name}'s account was updated.`,
      })

      return updatedUser
    } catch (error) {
      this.handleDuplicateEmailError(
        error,
      )

      throw error
    }
  }

  async activate(
    id: number,
    actorUserId: number,
  ) {
    const actor =
      await this.requireAdmin(
        actorUserId,
      )

    const target =
      await this.findOne(id)

    if (
      target.status ===
      UserStatus.ACTIVE
    ) {
      throw new BadRequestException(
        'This account is already active',
      )
    }

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id,
        },

        data: {
          status:
            UserStatus.ACTIVE,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

    await this.safeCreateAuditLog({
      actorUserId:
        actor.id,

      targetUserId:
        updatedUser.id,

      action:
        AuditAction.ACCOUNT_ACTIVATED,

      description:
        `${actor.name} activated ${updatedUser.name}'s account.`,
    })

    return updatedUser
  }

  async deactivate(
    id: number,
    actorUserId: number,
  ) {
    const actor =
      await this.requireAdmin(
        actorUserId,
      )

    const target =
      await this.findOne(id)

    if (
      actor.id === target.id
    ) {
      throw new BadRequestException(
        'You cannot deactivate your own administrator account',
      )
    }

    if (
      target.status ===
      UserStatus.INACTIVE
    ) {
      throw new BadRequestException(
        'This account is already inactive',
      )
    }

    const updatedUser =
      await this.prisma.user.update({
        where: {
          id,
        },

        data: {
          status:
            UserStatus.INACTIVE,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

    await this.safeCreateAuditLog({
      actorUserId:
        actor.id,

      targetUserId:
        updatedUser.id,

      action:
        AuditAction.ACCOUNT_DEACTIVATED,

      description:
        `${actor.name} deactivated ${updatedUser.name}'s account.`,
    })

    return updatedUser
  }

  async remove(
    id: number,
  ) {
    const user =
      await this.findOne(id)

    const deletedUser =
      await this.prisma.user.delete({
        where: {
          id,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      })

    /*
     * We intentionally don't create
     * an audit log referencing the
     * deleted user here because the
     * user no longer exists.
     *
     * For normal account management,
     * prefer deactivate instead.
     */

    return {
      ...deletedUser,

      message:
        `${user.name} was deleted successfully`,
    }
  }

  private async requireAdmin(
    userId: number,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      })

    if (!user) {
      throw new NotFoundException(
        `Administrator with ID ${userId} not found`,
      )
    }

    if (
      user.role !==
      UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Administrator access is required',
      )
    }

    if (
      user.status !==
      UserStatus.ACTIVE
    ) {
      throw new ForbiddenException(
        'The administrator account is inactive',
      )
    }

    return user
  }

  private async safeCreateAuditLog(
    data: {
      actorUserId?:
        number | null

      targetUserId?:
        number | null

      action:
        AuditAction

      description:
        string
    },
  ) {
    try {
      await this.auditLogsService.create(
        data,
      )
    } catch (error) {
      console.error(
        'Unable to create audit log:',
        error,
      )
    }
  }

  private handleDuplicateEmailError(
    error: unknown,
  ): void {
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'A user with this email already exists',
      )
    }
  }
}