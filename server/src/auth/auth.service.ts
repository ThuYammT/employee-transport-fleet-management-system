import {
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'

import {
  AuditAction,
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client'

import * as bcrypt from 'bcrypt'

import {
  timingSafeEqual,
} from 'crypto'

import {
  AuditLogsService,
} from '../audit-logs/audit-logs.service'

import {
  PrismaService,
} from '../prisma/prisma.service'

import {
  LoginDto,
} from './dto/login.dto'

import {
  LogoutDto,
} from './dto/logout.dto'

import {
  RegisterDto,
} from './dto/register.dto'

import {
  SetupAdminDto,
} from './dto/setup-admin.dto'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma:
      PrismaService,

    private readonly auditLogsService:
      AuditLogsService,
  ) {}

  async register(
    registerDto: RegisterDto,
    ipAddress?: string | null,
    userAgent?: string | null,
  ) {
    const normalizedEmail =
      registerDto.email
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
        'An account with this email already exists',
      )
    }

    const passwordHash =
      await bcrypt.hash(
        registerDto.password,
        12,
      )

    try {
      const user =
        await this.prisma.user.create({
          data: {
            name:
              registerDto.name.trim(),

            email:
              normalizedEmail,

            passwordHash,

            phone:
              registerDto.phone
                ?.trim() ||
              null,

            // Public registration is
            // always employee-only.
            role:
              UserRole.EMPLOYEE,

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
          `${user.name} created an employee account.`,

        ipAddress,
        userAgent,
      })

      return user
    } catch (error) {
      this.handleDuplicateEmailError(
        error,
      )

      throw error
    }
  }

  async login(
    loginDto: LoginDto,
    ipAddress?: string | null,
    userAgent?: string | null,
  ) {
    const normalizedEmail =
      loginDto.email
        .trim()
        .toLowerCase()

    const user =
      await this.prisma.user.findUnique({
        where: {
          email:
            normalizedEmail,
        },
      })

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      )
    }

    const passwordMatches =
      await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      )

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password',
      )
    }

    if (
      user.status !==
      UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException(
        'Your account is currently inactive',
      )
    }

    await this.safeCreateAuditLog({
      actorUserId:
        user.id,

      targetUserId:
        user.id,

      action:
        AuditAction.LOGIN,

      description:
        `${user.name} signed in.`,

      ipAddress,
      userAgent,
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      createdAt:
        user.createdAt,
      updatedAt:
        user.updatedAt,
    }
  }

  async logout(
    logoutDto: LogoutDto,
    ipAddress?: string | null,
    userAgent?: string | null,
  ) {
    const user =
      await this.prisma.user.findUnique({
        where: {
          id:
            logoutDto.userId,
        },

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      })

    if (!user) {
      throw new NotFoundException(
        `User with ID ${logoutDto.userId} not found`,
      )
    }

    await this.safeCreateAuditLog({
      actorUserId:
        user.id,

      targetUserId:
        user.id,

      action:
        AuditAction.LOGOUT,

      description:
        `${user.name} signed out.`,

      ipAddress,
      userAgent,
    })

    return {
      message:
        'Signed out successfully',
    }
  }

  async getSetupStatus() {
    const existingAdmin =
      await this.prisma.user.findFirst({
        where: {
          role:
            UserRole.ADMIN,
        },

        select: {
          id: true,
        },
      })

    const configuredSetupKey =
      process.env
        .INITIAL_ADMIN_SETUP_KEY

    return {
      adminSetupRequired:
        !existingAdmin,

      setupConfigured:
        typeof configuredSetupKey ===
          'string' &&
        configuredSetupKey.length >=
          16,
    }
  }

  async setupFirstAdmin(
    setupAdminDto:
      SetupAdminDto,

    ipAddress?: string | null,
    userAgent?: string | null,
  ) {
    const configuredSetupKey =
      process.env
        .INITIAL_ADMIN_SETUP_KEY

    if (
      !configuredSetupKey ||
      configuredSetupKey.length <
        16
    ) {
      throw new ServiceUnavailableException(
        'Initial admin setup has not been configured on the server',
      )
    }

    if (
      !this.setupKeysMatch(
        setupAdminDto.setupKey,
        configuredSetupKey,
      )
    ) {
      throw new UnauthorizedException(
        'The admin setup key is invalid',
      )
    }

    const normalizedEmail =
      setupAdminDto.email
        .trim()
        .toLowerCase()

    const existingAdmin =
      await this.prisma.user.findFirst({
        where: {
          role:
            UserRole.ADMIN,
        },

        select: {
          id: true,
        },
      })

    if (existingAdmin) {
      throw new ConflictException(
        'Initial admin setup has already been completed',
      )
    }

    const existingEmail =
      await this.prisma.user.findUnique({
        where: {
          email:
            normalizedEmail,
        },

        select: {
          id: true,
        },
      })

    if (existingEmail) {
      throw new ConflictException(
        'An account with this email already exists',
      )
    }

    const passwordHash =
      await bcrypt.hash(
        setupAdminDto.password,
        12,
      )

    try {
      const admin =
        await this.prisma.user.create({
          data: {
            name:
              setupAdminDto.name.trim(),

            email:
              normalizedEmail,

            passwordHash,

            phone:
              setupAdminDto.phone
                ?.trim() ||
              null,

            role:
              UserRole.ADMIN,

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
          admin.id,

        targetUserId:
          admin.id,

        action:
          AuditAction.ADMIN_CREATED,

        description:
          `Initial administrator account created for ${admin.name}.`,

        ipAddress,
        userAgent,
      })

      return {
        ...admin,

        message:
          'Initial administrator account created successfully',
      }
    } catch (error) {
      this.handleDuplicateEmailError(
        error,
      )

      throw error
    }
  }

  private setupKeysMatch(
    submittedKey: string,
    configuredKey: string,
  ): boolean {
    const submittedBuffer =
      Buffer.from(
        submittedKey,
        'utf8',
      )

    const configuredBuffer =
      Buffer.from(
        configuredKey,
        'utf8',
      )

    if (
      submittedBuffer.length !==
      configuredBuffer.length
    ) {
      return false
    }

    return timingSafeEqual(
      submittedBuffer,
      configuredBuffer,
    )
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

      ipAddress?:
        string | null

      userAgent?:
        string | null
    },
  ) {
    try {
      await this.auditLogsService.create(
        data,
      )
    } catch (error) {
      /*
       * Audit logging should never
       * prevent a valid login/logout
       * from completing.
       */
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
        'An account with this email already exists',
      )
    }
  }
}