import { Injectable } from '@nestjs/common';
import { CollectionRepository } from './colletion.repository';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { Collection } from './collection.entity';
import { InscriptionService } from '@src/inscription/inscription.service';
import { BuyNowActivity } from '@src/buy-now-activity/buy-now-activity.entity';
import { Inscription } from '@src/inscription/inscription.entity';

@Injectable()
export class CollectionService {
  constructor(
    private collectionRepository: CollectionRepository,
    private inscriptionService: InscriptionService,
  ) {}

  async createCollection(body: CreateCollectionDto) {
    const collection: Partial<Collection> = {
      ...body,
    };
    const savedCollection = await this.collectionRepository.save(collection);

    const saveInscriptions = body.inscriptionIds.map(
      async (inscriptionId: string) => {
        return this.inscriptionService.createInscription(
          savedCollection.id,
          inscriptionId,
        );
      },
    );
    const savedInscriptions = await Promise.all(saveInscriptions);

    return this.collectionRepository.findOne({
      where: {
        id: savedCollection.id,
      },
      relations: {
        inscription: true,
      },
    });
  }

  async getDiscoverCollectionDatas() {
    const collectFloorPrices = await this.collectionRepository
      .createQueryBuilder('collection')
      .select(['collection.id as collection_id', 'min(prices.price) as price'])
      .from((subQuery) => {
        return subQuery
          .select([
            'buy_now_activity.price as price',
            'inscription.id as inscription_id',
            'collection_id',
          ])
          .from(BuyNowActivity, 'buy_now_activity')
          .addFrom(Inscription, 'inscription')
          .where('buy_now_activity.inscription_id=inscription.id');
      }, 'prices')
      .where('collection.id=prices.collection_id')
      .groupBy('collection.id')
      .limit(6)
      .getRawMany();

    console.log('collectFloorPrices', collectFloorPrices);

    const collectionDatas = await this.collectionRepository
      .createQueryBuilder('collection')
      .select([
        'collection.name as name',
        'collection.description as description',
        'collection.img_url as img_url',
        'inscription_limited.inscription_network_id as inscription_network_id',
      ])
      .from((subQuery) => {
        return subQuery
          .select([
            'inscription.inscription_id as inscription_network_id',
            'inscription.collection_id as collection_id',
          ])
          .from(Inscription, 'inscription')
          .limit(3);
      }, 'inscription_limited')
      .where('inscription_limited.collection_id=collection.id')
      .limit(6)
      .getRawMany();

    console.log('collectionDatas', collectionDatas);

    // const datas = collectionDatas.map()
    return collectionDatas;
  }
}
