import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { CollectionRepository } from './colletion.repository';
import { InscriptionModule } from '@src/inscription/inscription.module';
import { InscriptionService } from '@src/inscription/inscription.service';

@Module({
  imports: [InscriptionModule],
  controllers: [CollectionController],
  providers: [CollectionService, CollectionRepository, InscriptionService],
})
export class CollectionModule {}
