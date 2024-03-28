import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, WalletTypes } from '@src/user/user.entity';
import { UserService } from '@src/user/user.service';
import { AccessTokenInterface } from './auth.type';
import { LoginUserDto } from './dto/login-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: Partial<User>) {
    const accessToken = await this.createAccessToken(user);

    return {
      accessToken,
    };
  }

  async validateUser(body: LoginUserDto): Promise<Partial<User> | null> {
    const user = await this.userService.findByAddress(body.address);
    if (user) return { address: user.address, uuid: user.uuid };
    const savedUser = await this.userService.create(body);
    return { address: savedUser.address, uuid: savedUser.uuid };
  }

  private async createAccessToken(user: Partial<User>): Promise<string> {
    const payload: AccessTokenInterface = {
      address: user.address,
      uuid: user.uuid,
    };

    return this.jwtService.signAsync(payload);
  }

  async getUser(uuid: string): Promise<User> {
    return this.userService.findByUuid(uuid);
  }
}
