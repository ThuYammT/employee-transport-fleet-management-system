import { PartialType } from '@nestjs/mapped-types'
import { TransportRequestStatus } from '@prisma/client'
import {
  IsEnum,
  IsOptional,
} from 'class-validator'

import { CreateTransportRequestDto } from './create-transport-request.dto'

export class UpdateTransportRequestDto extends PartialType(
  CreateTransportRequestDto,
) {
  @IsOptional()
  @IsEnum(TransportRequestStatus)
  status?: TransportRequestStatus
}