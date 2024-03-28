import { Module } from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { InscriptionRepository } from './inscription.repository';
import { InscriptionController } from './inscription.controller';

@Module({
  providers: [InscriptionService, InscriptionRepository],
  exports: [InscriptionService, InscriptionRepository],
  controllers: [InscriptionController]
})
export class InscriptionModule {}
