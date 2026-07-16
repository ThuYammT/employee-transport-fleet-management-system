import {
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common'

import { AuthService } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { SetupAdminDto } from './dto/setup-admin.dto'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Get('setup-status')
  getSetupStatus() {
    return this.authService.getSetupStatus()
  }

  @Post('setup-admin')
  setupFirstAdmin(
    @Body() setupAdminDto: SetupAdminDto,
  ) {
    return this.authService.setupFirstAdmin(
      setupAdminDto,
    )
  }
}