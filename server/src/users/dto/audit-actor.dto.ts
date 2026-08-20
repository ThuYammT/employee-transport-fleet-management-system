import {
  IsInt,
  Min,
} from 'class-validator'

export class AuditActorDto {
  @IsInt()
  @Min(1)
  actorUserId: number
}