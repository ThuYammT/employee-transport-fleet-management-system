import { Injectable, NotFoundException } from '@nestjs/common'
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
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    return user
  }

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
        data: {
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: createUserDto.password,
        role: createUserDto.role,
        phone: createUserDto.phone,
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
    }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id)

    return this.prisma.user.update({
        where: { id },
        data: {
        name: updateUserDto.name,
        email: updateUserDto.email,
        passwordHash: updateUserDto.password,
        role: updateUserDto.role,
        phone: updateUserDto.phone,
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
}