import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
} from '@nestjs/common'

import type {
  Request,
} from 'express'

import {
  AuthService,
} from './auth.service'

import {
  LoginDto,
} from './dto/login.dto'

import {
  LogoutDto,
} from './dto/logout.dto'

import {
  RegisterDto,
} from './dto/register.dto'

import {
  SetupAdminDto,
} from './dto/setup-admin.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService:
      AuthService,
  ) {}

  @Post('register')
  register(
    @Body()
    registerDto: RegisterDto,

    @Req()
    request: Request,

    @Headers('user-agent')
    userAgent?: string,
  ) {
    return this.authService.register(
      registerDto,
      this.getIpAddress(request),
      userAgent,
    )
  }

  @Post('login')
  login(
    @Body()
    loginDto: LoginDto,

    @Req()
    request: Request,

    @Headers('user-agent')
    userAgent?: string,
  ) {
    return this.authService.login(
      loginDto,
      this.getIpAddress(request),
      userAgent,
    )
  }

  @Post('logout')
  logout(
    @Body()
    logoutDto: LogoutDto,

    @Req()
    request: Request,

    @Headers('user-agent')
    userAgent?: string,
  ) {
    return this.authService.logout(
      logoutDto,
      this.getIpAddress(request),
      userAgent,
    )
  }

  @Get('setup-status')
  getSetupStatus() {
    return this.authService.getSetupStatus()
  }

  @Post('setup-admin')
  setupFirstAdmin(
    @Body()
    setupAdminDto:
      SetupAdminDto,

    @Req()
    request: Request,

    @Headers('user-agent')
    userAgent?: string,
  ) {
    return this.authService.setupFirstAdmin(
      setupAdminDto,
      this.getIpAddress(request),
      userAgent,
    )
  }

  private getIpAddress(
    request: Request,
  ): string | null {
    const forwardedFor =
      request.headers[
        'x-forwarded-for'
      ]

    if (
      typeof forwardedFor ===
      'string'
    ) {
      return (
        forwardedFor
          .split(',')[0]
          ?.trim() || null
      )
    }

    if (
      Array.isArray(
        forwardedFor,
      )
    ) {
      return (
        forwardedFor[0] ||
        null
      )
    }

    return (
      request.ip ||
      request.socket
        ?.remoteAddress ||
      null
    )
  }
}