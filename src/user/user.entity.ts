import { ApiProperty } from '@nestjs/swagger';
import { BuyNowActivity } from '@src/buy-now-activity/buy-now-activity.entity';
import { BuyNowOffer } from '@src/buy-now-offer/buy-now-offer.entity';
import { Exclude } from 'class-transformer';
import {
  CreateDateColumn,
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum WalletTypes {
  UNISAT = 'Unisat',
  XVERSE = 'Xverse',
  HIRO = 'Hiro',
}

@Entity('user')
export class User {
  @Exclude({ toPlainOnly: true })
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ApiProperty({ description: `Unique uuid`, maximum: 36 })
  @Column({ type: 'varchar', nullable: false, length: 36 })
  uuid: string;

  @ApiProperty({ description: 'Display name', maximum: 128, required: false })
  @Column({ type: 'varchar', nullable: true, length: 128 })
  name: string;

  @ApiProperty({ description: 'E-mail', maximum: 255, required: false })
  @Column({ type: 'varchar', nullable: true, length: 255 })
  email: string;

  @ApiProperty({ description: 'Bio', maximum: 255, required: false })
  @Column({ type: 'varchar', nullable: true, length: 255 })
  bio: string;

  @ApiProperty({ description: 'WebSite', maximum: 255, required: false })
  @Column({ type: 'varchar', nullable: true, length: 255 })
  website: string;

  @ApiProperty({ description: 'Twitter', maximum: 255, required: false })
  @Column({ type: 'varchar', nullable: true, length: 255 })
  twitter: string;

  @ApiProperty({ description: 'Facebook', maximum: 255, required: false })
  @Column({ type: 'varchar', nullable: true, length: 255 })
  facebook: string;

  @ApiProperty({ description: 'Public key', maximum: 255, required: true })
  @Column({
    type: 'varchar',
    nullable: false,
    length: 255,
  })
  pubkey: string;

  @ApiProperty({ description: 'Address', maximum: 255, required: true })
  @Column({ type: 'varchar', nullable: false, length: 255 })
  address: string;

  @ApiProperty({ description: 'Wallet type', maximum: 255, required: true })
  @Column({ type: 'enum', enum: WalletTypes, nullable: false })
  walletType: WalletTypes;

  @ApiProperty({ description: 'Is Registered', maximum: 255, required: true })
  @Column({ type: 'boolean', nullable: false, default: false })
  isRegistered: boolean;

  @ApiProperty({
    description: 'Date when the user was created',
    required: true,
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when user was updated the last time',
    required: false,
  })
  @UpdateDateColumn()
  updatedAt: Date;

  @Exclude({ toPlainOnly: true })
  @DeleteDateColumn()
  deletedAt: Date;

  @OneToMany(() => BuyNowActivity, (buyNowActivity) => buyNowActivity.user)
  buyNowActivity: BuyNowActivity[];

  @OneToMany(() => BuyNowOffer, (buyNowOffer) => buyNowOffer.user)
  buyNowOffer: BuyNowOffer[];
}
