import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';
import { CreateBuyNowActivityDto } from './dto/create-buy-now-activity.dto';
import { BuyNowActivityService } from './buy-now-activity.service';
import { BuyNowActivity } from './buy-now-activity.entity';

@Controller('buy-now-activity')
export class BuyNowActivityController {
  constructor(private buyNowActivityService: BuyNowActivityService) {}

  @ApiOperation({ description: `Update user information` })
  @UseGuards(JwtAuthGuard)
  @Post('/create')
  async create(
    @Body() body: CreateBuyNowActivityDto,
    @Request() req,
  ): Promise<Partial<BuyNowActivity>> {
    const buyNowActivity =
      await this.buyNowActivityService.createBuyNowActivity(
        body,
        req.user.uuid,
      );
    return {
      price: buyNowActivity.price,
      inscriptionId: buyNowActivity.inscriptionId,
    };
  }

  @ApiOperation({ description: `Get inscription buy now price information` })
  @UseGuards(JwtAuthGuard)
  @Get('/inscription-price/:inscriptionId')
  async getInscriptionPrice(
    @Param('inscriptionId') inscriptionId,
  ): Promise<Partial<BuyNowActivity>> {
    const buyNowActivity = await this.buyNowActivityService.getBuyNowActivity(
      inscriptionId,
    );

    if (buyNowActivity)
      return {
        price: buyNowActivity.price,
      };
    throw new BadRequestException('Can not find Buy Now Activity');
  }

  @ApiOperation({ description: `Get inscription buy now price information` })
  @UseGuards(JwtAuthGuard)
  @Get('/inscription-info/:inscriptionId')
  async getInscriptionInfo(
    @Param('inscriptionId') inscriptionId,
    @Request() req,
  ): Promise<Partial<BuyNowActivity>> {
    const buyNowInscriptionData =
      await this.buyNowActivityService.getDiscoverBuyNowActivityByInscriptionId(
        inscriptionId,
      );

    if (buyNowInscriptionData) return buyNowInscriptionData;
    throw new BadRequestException('Can not find Buy Now Activity');
  }

  @ApiOperation({ description: `Update user information` })
  @UseGuards(JwtAuthGuard)
  @Get('/discover')
  async getDiscoverDatas() {
    return this.buyNowActivityService.getDiscoverBuyNowActivityDatas();
  }
}
