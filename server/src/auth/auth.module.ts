import {
  Module,
} from '@nestjs/common'

import {
  AuditLogsModule,
} from '../audit-logs/audit-logs.module'

import {
  PrismaModule,
} from '../prisma/prisma.module'

import {
  AuthController,
} from './auth.controller'

import {
  AuthService,
} from './auth.service'

@Module({
  imports: [
    PrismaModule,
    AuditLogsModule,
  ],

  controllers: [
    AuthController,
  ],

  providers: [
    AuthService,
  ],
})
export class AuthModule {}