import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { BuyNowOfferService } from './buy-now-offer.service';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { ApiOperation } from '@nestjs/swagger';
import { GenerateBuyNowPsbtDto } from './dto/generate-buy-now-psbt.dto';
import { BuyerSignPsbtDto } from './dto/buyer-sign-psbt.dto';
import { OwnerSignPsbtDto } from './dto/owner-sign-psbt.dto';

@Controller('buy-now-offer')
export class BuyNowOfferController {
  constructor(private buyNowOfferService: BuyNowOfferService) {}

  @ApiOperation({ description: `Generate swap psbt` })
  @UseGuards(JwtAuthGuard)
  @Post('/generate-psbt')
  async generatePsbt(
    @Request() req,
    @Body() body: GenerateBuyNowPsbtDto,
  ): Promise<{ psbt: string; inputCount }> {
    const { psbt, inputCount } = await this.buyNowOfferService.generatePsbt({
      buyerPubkey: body.buyerPubkey,
      inscriptionId: body.inscriptionId,
      recipient: req.user.address,
      walletType: body.walletType,
    });

    return {
      psbt,
      inputCount,
    };
  }

  @ApiOperation({ description: `Buyer sign psbt` })
  @UseGuards(JwtAuthGuard)
  @Post('/buyer-sign-psbt')
  async buyerSignPsbt(
    @Request() req,
    @Body() body: BuyerSignPsbtDto,
  ): Promise<{ msg: string }> {
    const res = await this.buyNowOfferService.buyerSignPsbt(
      body,
      req.user.address,
    );

    return {
      msg: 'Congratulations! Successfully created a buy now offer',
    };
  }

  @ApiOperation({ description: `Buyer sign psbt` })
  @UseGuards(JwtAuthGuard)
  @Post('/owner-sign-psbt')
  async ownerSignPsbt(
    @Request() req,
    @Body() body: OwnerSignPsbtDto,
  ): Promise<{ msg: string }> {
    const res = await this.buyNowOfferService.ownerSignPsbt(
      body,
      req.user.address,
    );

    return {
      msg: 'Congratulations! Successfully accepted a buy now offer',
    };
  }

  @ApiOperation({ description: `Buyer sign psbt` })
  @UseGuards(JwtAuthGuard)
  @Get('/active-offers')
  async getActiveOffers(@Request() req) {
    return this.buyNowOfferService.getActiveOffers(req.user.address);
  }
}
