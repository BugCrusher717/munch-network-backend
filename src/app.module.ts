import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvHelper } from './common/helpers/env.helper';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { validate } from './common/validators/env.validator';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { BuyNowActivityModule } from './buy-now-activity/buy-now-activity.module';
import { BuyNowOfferModule } from './buy-now-offer/buy-now-offer.module';
import { CollectionModule } from './collection/collection.module';
import { InscriptionService } from './inscription/inscription.service';
import { InscriptionModule } from './inscription/inscription.module';
import { PsbtModule } from './psbt/psbt.module';
import psbtConfig from './config/psbt.config';

EnvHelper.verifyNodeEnv();

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: EnvHelper.getEnvFilePath(),
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, psbtConfig],
      validate: validate,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = configService.get('databaseConfig');
        return {
          ...config,
          namingStrategy: new SnakeNamingStrategy(),
          autoLoadEntities: true,
        };
      },
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    BuyNowActivityModule,
    BuyNowOfferModule,
    CollectionModule,
    InscriptionModule,
    PsbtModule,
  ],
  controllers: [AppController],
  providers: [AppService, InscriptionService],
})
export class AppModule {}
