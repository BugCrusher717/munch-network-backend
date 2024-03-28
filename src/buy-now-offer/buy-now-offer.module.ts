import { Module } from '@nestjs/common';
import { BuyNowOfferController } from './buy-now-offer.controller';
import { BuyNowOfferService } from './buy-now-offer.service';
import { BuyNowOfferRepository } from './buy-now-offer.repository';
import { PsbtModule } from '@src/psbt/psbt.module';
import { PsbtService } from '@src/psbt/psbt.service';
import { BuyNowActivityModule } from '@src/buy-now-activity/buy-now-activity.module';
import { BuyNowActivityService } from '@src/buy-now-activity/buy-now-activity.service';
import { UserModule } from '@src/user/user.module';
import { InscriptionModule } from '@src/inscription/inscription.module';
import { UserService } from '@src/user/user.service';

@Module({
  imports: [PsbtModule, BuyNowActivityModule, UserModule, InscriptionModule],
  controllers: [BuyNowOfferController],
  providers: [
    BuyNowOfferService,
    BuyNowOfferRepository,
    PsbtService,
    BuyNowActivityService,
    UserService
  ],
})
export class BuyNowOfferModule {}
