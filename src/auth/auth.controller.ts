import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@src/auth/auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiBearerAuth, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { ApiResponseHelper } from '@src/common/helpers/api-response.helper';
import { User } from '@src/user/user.entity';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ description: `User login` })
  @ApiResponse(ApiResponseHelper.success(User))
  @ApiResponse(ApiResponseHelper.validationError(`Validation failed`))
  @Post('login')
  async login(@Body() body: LoginUserDto) {
    const user = await this.authService.validateUser(body);
    const authData = await this.authService.login(user);
    return { accessToken: authData.accessToken };
  }
  @ApiBearerAuth()
  @ApiResponse(ApiResponseHelper.success(User))
  @ApiResponse(ApiResponseHelper.unauthorized())
  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  async success(@Request() req): Promise<Partial<User>> {
    const user = await this.authService.getUser(req.user.uuid);
    return {
      name: user.name,
      email: user.email,
      bio: user.bio,
      website: user.website,
      twitter: user.twitter,
      facebook: user.facebook,
      isRegistered: user.isRegistered,
      address: user.address,
      walletType: user.walletType,
    };
  }
}
