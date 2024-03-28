import { ApiProperty } from '@nestjs/swagger';
import { BuyNowActivity } from '@src/buy-now-activity/buy-now-activity.entity';
import { Collection } from '@src/collection/collection.entity';
import { Exclude } from 'class-transformer';
import {
  CreateDateColumn,
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity('inscription')
export class Inscription {
  @Exclude({ toPlainOnly: true })
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ApiProperty({ description: `Unique uuid`, maximum: 36 })
  @Column({ type: 'varchar', nullable: false, length: 36 })
  uuid: string;

  @ApiProperty({ description: `Inscription Id`, maximum: 36 })
  @Column({ type: 'varchar', nullable: false })
  inscriptionId: string;

  @Column({type: 'integer', nullable:false})
  collectionId: number;

  @ManyToOne(() => Collection, (collection) => collection.inscription)
  collection: Collection;

  @OneToMany(
    () => BuyNowActivity,
    (buyNowActivity) => buyNowActivity.inscription,
  )
  buyNowActivity: BuyNowActivity[];

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
}
