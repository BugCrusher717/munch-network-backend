import { BadRequestException, Injectable } from '@nestjs/common';
import { PsbtService } from '@src/psbt/psbt.service';
import { User, WalletTypes } from '@src/user/user.entity';
import { testnet } from 'bitcoinjs-lib/src/networks';
import { BuyNowOfferRepository } from './buy-now-offer.repository';
import { BuyNowActivityService } from '@src/buy-now-activity/buy-now-activity.service';
import { OfferStatus } from './buy-now-offer.entity';
import { UserService } from '@src/user/user.service';
import { BuyerSignPsbtDto } from './dto/buyer-sign-psbt.dto';
import { BuyNowActivity } from '@src/buy-now-activity/buy-now-activity.entity';
import { Inscription } from '@src/inscription/inscription.entity';
import { OwnerSignPsbtDto } from './dto/owner-sign-psbt.dto';

@Injectable()
export class BuyNowOfferService {
  constructor(
    private psbtService: PsbtService,
    private buyNowOfferRepository: BuyNowOfferRepository,
    private buyNowActivityService: BuyNowActivityService,
    private userService: UserService,
  ) {}

  async generatePsbt({
    inscriptionId,
    recipient,
    buyerPubkey,
    walletType,
  }: {
    inscriptionId: string;
    recipient: string;
    buyerPubkey: string;
    walletType: WalletTypes;
  }): Promise<{ psbt: string; inputCount: number }> {
    const txData = await this.buyNowActivityService.getBuyNowPsbtDatas({
      inscriptionId,
    });

    const { psbt, inputCount } = await this.psbtService.generateBuyNowPsbt({
      ownerPubkey: txData.pubkey,
      buyerPubkey,
      walletType,
      recipient,
      network: testnet,
      inscriptionId,
      price: txData.price * 10 ** 8,
    });

    const user = await this.userService.findByAddress(recipient);

    const buyNowOffer = await this.buyNowOfferRepository.findOne({
      where: {
        userId: user.id,
        buyNowActivityId: txData.buyNowActivityId,
      },
    });

    if (buyNowOffer) {
      await this.buyNowOfferRepository.update(
        {
          userId: user.id,
          buyNowActivityId: txData.buyNowActivityId,
        },
        {
          price: txData.price,
          status: OfferStatus.CREATED,
          psbt,
        },
      );
    } else {
      const buyNowOffer = this.buyNowOfferRepository.create({
        buyNowActivityId: txData.buyNowActivityId,
        price: txData.price,
        status: OfferStatus.CREATED,
        psbt,
        user,
      });

      await this.buyNowOfferRepository.save(buyNowOffer);
    }

    if (walletType === WalletTypes.XVERSE) {
      const base64Psbt = this.psbtService.convertHexedToBase64(psbt);
      return { psbt: base64Psbt, inputCount };
    }

    return { psbt, inputCount };
  }

  async buyerSignPsbt(body: BuyerSignPsbtDto, userAddress: string) {
    const user = await this.userService.findByAddress(userAddress);

    const buyNowOffer = await this.buyNowOfferRepository.findOne({
      where: { psbt: body.psbt, userId: user.id },
    });

    if (!buyNowOffer)
      throw new BadRequestException('Can not find that buy now offer');

    // if(body.walletType === WalletTypes.)

    const res = await this.buyNowOfferRepository.update(
      { psbt: body.psbt },
      {
        buyerSignedPsbt: body.signedPsbt,
        status: OfferStatus.SIGNED,
        isRead: false,
      },
    );

    return true;
  }

  async ownerSignPsbt(body: OwnerSignPsbtDto, userAddress: string) {
    const user = await this.userService.findByAddress(userAddress);

    const buyNowOffer = await this.buyNowOfferRepository.findOne({
      where: { psbt: body.psbt, userId: user.id },
    });

    if (!buyNowOffer)
      throw new BadRequestException('Can not find that buy now offer');

    const res = await this.buyNowOfferRepository.update(
      { psbt: body.psbt },
      {
        userSignedPsbt: body.signedPsbt,
        status: OfferStatus.ACCEPTED,
        isRead: true,
      },
    );

    return true;
  }

  async getActiveOffers(ownerAddress: string) {
    const user = await this.userService.findByAddress(ownerAddress);

    const offerData = await this.buyNowOfferRepository
      .createQueryBuilder('buy_now_offer')
      .select([
        'buy_now_offer.price as price',
        'user.address as buyer_address',
        'user.wallet_type as wallet_type',
        'user.name as user_name',
        'buy_now_offer.psbt as psbt',
        'buy_now_offer.is_read as is_read',
        'inscription.inscription_id as inscription_id',
        'buy_now_offer.uuid as uuid',
      ])
      .from(User, 'user')
      .addFrom(BuyNowActivity, 'buy_now_activity')
      .addFrom(Inscription, 'inscription')
      .where('buy_now_activity.id=buy_now_offer.buy_now_activity_id')
      .andWhere('user.id=buy_now_offer.user_id')
      .andWhere(`buy_now_activity.user_id=${user.id}`)
      .andWhere('inscription.id=buy_now_activity.inscription_id')
      .andWhere(`buy_now_offer.status='${OfferStatus.SIGNED}'`)
      .getRawMany();

    return offerData;
  }
}
