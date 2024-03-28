import { Injectable } from '@nestjs/common';
import { Inscription } from './inscription.entity';
import { InscriptionRepository } from './inscription.repository';

@Injectable()
export class InscriptionService {
  constructor(private inscriptionRepository: InscriptionRepository) {}

  async findInscriptionById(inscriptionId: string): Promise<Inscription> {
    return this.inscriptionRepository.findOne({ where: { inscriptionId } });
  }

  async getInscriptionInfo(inscriptionId: string) {
    const inscriptionInfo = await this.inscriptionRepository.findOne({
      select: {
        collection: {
          name: true,
          description: true,
          imgUrl: true,
        },
      },
      where: { inscriptionId },
      relations: {
        collection: true,
      },
    });

    return inscriptionInfo;
  }

  async createInscription(
    collectionId: number,
    inscriptionId: string,
  ): Promise<Inscription> {
    const inscription: Partial<Inscription> = {
      collectionId,
      inscriptionId,
    };

    return this.inscriptionRepository.save(inscription);
  }
}
