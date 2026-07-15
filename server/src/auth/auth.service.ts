import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { Prisma, UserRole, UserStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'

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
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        )
      }

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

    if (!user.name.trim()) {
      throw new BadRequestException(
        'This account has incomplete profile information',
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
}