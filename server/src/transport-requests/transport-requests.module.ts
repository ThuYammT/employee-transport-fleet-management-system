import { Module } from '@nestjs/common'
import { TransportRequestsController } from './transport-requests.controller'
import { TransportRequestsService } from './transport-requests.service'

@Module({
  controllers: [TransportRequestsController],
  providers: [TransportRequestsService],
})
export class TransportRequestsModule {}