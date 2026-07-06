import { PartialType } from '@nestjs/mapped-types'
import { IsEnum, IsOptional } from 'class-validator'
import { TransportRequestStatus } from '@prisma/client'
import { CreateTransportRequestDto } from './create-transport-request.dto'

export class UpdateTransportRequestDto extends PartialType(
  CreateTransportRequestDto,
) {
    @IsOptional()
    @IsEnum(TransportRequestStatus)
    status?: TransportRequestStatus
}