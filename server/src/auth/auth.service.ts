import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import {
  Prisma,
  UserRole,
  UserStatus,
} from '@prisma/client'
import * as bcrypt from 'bcrypt'
import { timingSafeEqual } from 'crypto'

import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { SetupAdminDto } from './dto/setup-admin.dto'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email
      .trim()
      .toLowerCase()

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (existingUser) {
      throw new ConflictException(
        'An account with this email already exists',
      )
    }

    const passwordHash = await bcrypt.hash(
      registerDto.password,
      12,
    )

    try {
      return await this.prisma.user.create({
        data: {
          name: registerDto.name.trim(),
          email: normalizedEmail,
          passwordHash,
          phone: registerDto.phone?.trim() || null,

          // Public registration remains employee-only.
          role: UserRole.EMPLOYEE,
          status: UserStatus.ACTIVE,
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
    } catch (error) {
      this.handleDuplicateEmailError(error)
      throw error
    }
  }

  async login(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email
      .trim()
      .toLowerCase()

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password',
      )
    }

    const passwordMatches = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    )

    if (!passwordMatches) {
      throw new UnauthorizedException(
        'Invalid email or password',
      )
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException(
        'Your account is currently inactive',
      )
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async getSetupStatus() {
    const existingAdmin = await this.prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
      },
      select: {
        id: true,
      },
    })

    const configuredSetupKey =
      process.env.INITIAL_ADMIN_SETUP_KEY

    return {
      adminSetupRequired: !existingAdmin,
      setupConfigured:
        typeof configuredSetupKey === 'string' &&
        configuredSetupKey.length >= 16,
    }
  }

  async setupFirstAdmin(
    setupAdminDto: SetupAdminDto,
  ) {
    const configuredSetupKey =
      process.env.INITIAL_ADMIN_SETUP_KEY

    if (
      !configuredSetupKey ||
      configuredSetupKey.length < 16
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

    const normalizedEmail = setupAdminDto.email
      .trim()
      .toLowerCase()

    const existingAdmin =
      await this.prisma.user.findFirst({
        where: {
          role: UserRole.ADMIN,
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
          email: normalizedEmail,
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

    const passwordHash = await bcrypt.hash(
      setupAdminDto.password,
      12,
    )

    try {
      const admin = await this.prisma.user.create({
        data: {
          name: setupAdminDto.name.trim(),
          email: normalizedEmail,
          passwordHash,
          phone:
            setupAdminDto.phone?.trim() || null,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
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

      return {
        ...admin,
        message:
          'Initial administrator account created successfully',
      }
    } catch (error) {
      this.handleDuplicateEmailError(error)
      throw error
    }
  }
  private setupKeysMatch(
    submittedKey: string,
    configuredKey: string,
  ): boolean {
    const submittedBuffer = Buffer.from(
      submittedKey,
      'utf8',
    )

    const configuredBuffer = Buffer.from(
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