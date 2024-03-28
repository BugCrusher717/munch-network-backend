import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InscriptionService } from './inscription.service';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';

@Controller('inscription')
export class InscriptionController {
  constructor(private inscriptionService: InscriptionService) {}

  @ApiOperation({ description: `Get inscription buy now price information` })
  @UseGuards(JwtAuthGuard)
  @Get('/inscription-info/:inscriptionId')
  async getInscriptionInfo(@Param('inscriptionId') inscriptionId) {
    const inscriptionInfo = await this.inscriptionService.getInscriptionInfo(
      inscriptionId,
    );

    if (inscriptionInfo) return inscriptionInfo;

    throw new BadRequestException(
      'Can not find an information of this inscription',
    );
  }
}
