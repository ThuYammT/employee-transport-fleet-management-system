import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import * as bcrypt from 'bcrypt'

import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
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

  async create(createUserDto: CreateUserDto) {
    const normalizedEmail = createUserDto.email
      .trim()
      .toLowerCase()

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    })

    if (existingUser) {
      throw new ConflictException(
        'A user with this email already exists',
      )
    }

    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      12,
    )

    try {
      return await this.prisma.user.create({
        data: {
          name: createUserDto.name.trim(),
          email: normalizedEmail,
          passwordHash,
          role: createUserDto.role,
          phone: createUserDto.phone?.trim() || null,
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

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ) {
    await this.findOne(id)

    const updateData: Prisma.UserUpdateInput = {}

    if (updateUserDto.name !== undefined) {
      updateData.name = updateUserDto.name.trim()
    }

    if (updateUserDto.email !== undefined) {
      updateData.email = updateUserDto.email
        .trim()
        .toLowerCase()
    }

    if (updateUserDto.role !== undefined) {
      updateData.role = updateUserDto.role
    }

    if (updateUserDto.phone !== undefined) {
      updateData.phone =
        updateUserDto.phone.trim() || null
    }

    if (updateUserDto.password !== undefined) {
      updateData.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        12,
      )
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: updateData,
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

  async remove(id: number) {
    await this.findOne(id)

    return this.prisma.user.delete({
      where: { id },
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