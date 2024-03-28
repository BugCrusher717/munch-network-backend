import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './user.entity';
import { UserRepository } from './user.repository';
import axios from 'axios';
import { LoginUserDto } from '@src/auth/dto/login-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findByAddress(address: string): Promise<User> {
    return this.userRepository.findOne({ where: { address } });
  }

  async findByUuid(uuid: string): Promise<User> {
    return this.userRepository.findOne({ where: { uuid } });
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(uuid: string, body: UpdateUserDto): Promise<User> {
    await this.userRepository.update(
      { uuid },
      this.userRepository.create({ ...body, isRegistered: true }),
    );

    return this.findByUuid(uuid);
  }

  async create(body: LoginUserDto): Promise<User> {
    const userEntity: Partial<User> = {
      ...this.userRepository.create(body),
    };
    const user = await this.userRepository.save(userEntity, { reload: false });

    return this.findByUuid(user.uuid);
  }

  async findOne(id: number): Promise<User> {
    return this.userRepository.findOne({ where: { id } });
  }

  async checkSignature(address, signature, bipMessage) {
    const data = {
      jsonrpc: '1.0',
      id: 'bip322',
      method: 'verifymessage',
      params: [address, signature, bipMessage],
    };

    const config = {
      headers: {
        'content-type': 'text/plain',
      },
      auth: {
        username: process.env.RPC_USERNAME,
        password: process.env.RPC_PASSWORD,
      },
    };
    try {
      const res = await axios.post(
        `https://${process.env.RPC_HOST}:${process.env.RPC_PORT}/`,
        data,
        config,
      );
      return res.data.result ? true : false;
    } catch (err) {
      return false;
    }
  }
}
