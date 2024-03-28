import {
  Body,
  Controller,
  HttpStatus,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiResponseHelper } from '@src/common/helpers/api-response.helper';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ description: `Update user information` })
  @ApiResponse(ApiResponseHelper.success(User, HttpStatus.CREATED))
  @UseGuards(JwtAuthGuard)
  @Post('user/update')
  async updateUserProfile(
    @Body() body: UpdateUserDto,
    @Request() req,
  ): Promise<Partial<User>> {
    const user = await this.userService.update(req.user.uuid, body);
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
