import { Module } from '@nestjs/common'
import { FuelLogsService } from './fuel-logs.service'
import { FuelLogsController } from './fuel-logs.controller'

@Module({
  controllers: [FuelLogsController],
  providers: [FuelLogsService],
})
export class FuelLogsModule {}