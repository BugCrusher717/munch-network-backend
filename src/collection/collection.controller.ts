import {
  Controller,
  Post,
  UseGuards,
  Body,
  Request,
  Get,
} from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guards/jwt-auth.guard';

@Controller('collection')
export class CollectionController {
  constructor(private collectionService: CollectionService) {}

  @ApiOperation({ description: `Update user information` })
  @UseGuards(JwtAuthGuard)
  @Post('/create')
  async create(@Body() body: CreateCollectionDto) {
    return this.collectionService.createCollection(body);
  }

  @ApiOperation({ description: `Update user information` })
  @UseGuards(JwtAuthGuard)
  @Get('/discover')
  async getDiscoverDatas() {
    return this.collectionService.getDiscoverCollectionDatas();
  }
}
