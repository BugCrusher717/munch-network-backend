import { BadRequestException, Injectable } from '@nestjs/common';
import { BuyNowActivityRepository } from './buy-now-activity.repository';
import { CreateBuyNowActivityDto } from './dto/create-buy-now-activity.dto';
import { BuyNowActivity } from './buy-now-activity.entity';
import { UserService } from '@src/user/user.service';
import { InscriptionService } from '@src/inscription/inscription.service';
import { Inscription } from '@src/inscription/inscription.entity';
import { Collection } from '@src/collection/collection.entity';
import { User } from '@src/user/user.entity';

@Injectable()
export class BuyNowActivityService {
  constructor(
    private buyNowBuyNowActivityRepository: BuyNowActivityRepository,
    private userService: UserService,
    private inscriptionService: InscriptionService,
  ) {}
  async findByUuid(uuid: string): Promise<BuyNowActivity> {
    return this.buyNowBuyNowActivityRepository.findOne({ where: { uuid } });
  }

  async createBuyNowActivity(
    body: CreateBuyNowActivityDto,
    userUuid: string,
  ): Promise<BuyNowActivity> {
    const user = await this.userService.findByUuid(userUuid);

    const inscription = await this.inscriptionService.findInscriptionById(
      body.inscriptionId,
    );

    if (!inscription)
      throw new BadRequestException(
        'Can not find a collection that contains that inscription',
      );

    const buyNowActivity = await this.buyNowBuyNowActivityRepository.findOne({
      where: {
        userId: user.id,
        inscriptionId: inscription.id,
      },
    });

    if (buyNowActivity) {
      await this.buyNowBuyNowActivityRepository.update(
        { userId: user.id, inscriptionId: inscription.id },
        {
          price: body.price,
        },
      );
      return this.buyNowBuyNowActivityRepository.findOne({
        where: { userId: user.id, inscriptionId: inscription.id },
      });
    } else {
      const buyNowActivityEntity: Partial<BuyNowActivity> = {
        inscriptionId: inscription.id,
        price: body.price,
        user,
      };
      const SavedBuyNowActivity =
        await this.buyNowBuyNowActivityRepository.save(buyNowActivityEntity);

      return this.buyNowBuyNowActivityRepository.findOne({
        where: { uuid: SavedBuyNowActivity.uuid },
      });
    }
  }

  async getBuyNowActivity(inscriptionId: string): Promise<BuyNowActivity> {
    const inscription = await this.inscriptionService.findInscriptionById(
      inscriptionId,
    );
    if (!inscription)
      throw new BadRequestException(
        'Can not find a collection that include this inscription',
      );
    return this.buyNowBuyNowActivityRepository.findOne({
      where: { inscriptionId: inscription.id },
    });
  }

  async getDiscoverBuyNowActivityDatas() {
    const buyNowActivityInfos = await this.buyNowBuyNowActivityRepository
      .createQueryBuilder('buy_now_activity')
      .select([
        'user.name as user_name',
        'user.address as user_address',
        'inscription.inscription_id as inscription_id',
        'collection.img_url as collection_img',
        'collection.name as collection_name',
        'buy_now_activity.price as price',
      ])
      .from(Inscription, 'inscription')
      .addFrom(Collection, 'collection')
      .addFrom(User, 'user')
      .where('buy_now_activity.user_id=user.id')
      .andWhere('buy_now_activity.inscription_id=inscription.id')
      .andWhere('inscription.collection_id=collection.id')
      .limit(12)
      .getRawMany();

    return buyNowActivityInfos;
  }

  async getDiscoverBuyNowActivityByInscriptionId(inscriptionId: string) {
    const buyNowActivityInfo = await this.buyNowBuyNowActivityRepository
      .createQueryBuilder('buy_now_activity')
      .select([
        'user.name as user_name',
        'user.address as user_address',
        'inscription.inscription_id as inscription_id',
        'collection.img_url as collection_img',
        'collection.name as collection_name',
        'buy_now_activity.price as price',
        'collection.description as description',
      ])
      .from(Inscription, 'inscription')
      .addFrom(Collection, 'collection')
      .addFrom(User, 'user')
      .where('buy_now_activity.user_id=user.id')
      .andWhere('buy_now_activity.inscription_id=inscription.id')
      .andWhere('inscription.collection_id=collection.id')
      .andWhere(`inscription.inscription_id='${inscriptionId}'`)
      .getRawOne();

    return buyNowActivityInfo;
  }

  async getBuyNowPsbtDatas({
    inscriptionId,
  }: {
    inscriptionId: string;
  }): Promise<{
    pubkey: string;
    inscriptionId: string;
    price: number;
    buyNowActivityId: number;
  }> {
    const txData = await this.buyNowBuyNowActivityRepository
      .createQueryBuilder('buy_now_activity')
      .select([
        'user.pubkey as pubkey',
        'inscription.inscription_id as inscription_id',
        'buy_now_activity.price as price',
        'buy_now_activity.id as buy_now_activity_id',
      ])
      .from(User, 'user')
      .addFrom(Inscription, 'inscription')
      .where(`inscription.inscription_id='${inscriptionId}'`)
      .andWhere(`inscription.id=buy_now_activity.inscription_id`)
      .andWhere(`buy_now_activity.user_id=user.id`)
      .getRawOne();

    if (!txData)
      throw new BadRequestException(
        'Can not find price and inscription data in Database',
      );

    return {
      pubkey: txData.pubkey,
      inscriptionId: txData.inscription_id,
      price: txData.price,
      buyNowActivityId: txData.buy_now_activity_id,
    };
  }
}
