import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from 'typeorm';
import { BuyNowActivity } from './buy-now-activity.entity';
import { v4 as uuid } from 'uuid';

@EventSubscriber()
export class BuyNowActivitySubscriber
  implements EntitySubscriberInterface<BuyNowActivity>
{
  listenTo(): any {
    return BuyNowActivity;
  }

  beforeInsert(event: InsertEvent<BuyNowActivity>): void | Promise<any> {
    if (!event.entity.uuid) {
      event.entity.uuid = uuid();
    }
  }

  beforeUpdate(event: UpdateEvent<BuyNowActivity>): void {
    event.entity.updatedAt = new Date();
  }
}
