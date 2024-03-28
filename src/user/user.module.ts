import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserExistsByEmailValidator } from './validator/user-exists-by-email.validator';
import { UserExistsByAddressValidator } from './validator/user-exists-by-address.validator';

@Module({
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    UserExistsByEmailValidator,
    UserExistsByAddressValidator,
  ],
  exports: [UserService, UserRepository],
})
export class UserModule {}
