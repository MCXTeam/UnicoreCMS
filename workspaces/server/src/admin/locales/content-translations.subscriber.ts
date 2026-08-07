import { Injectable } from '@nestjs/common';
import { DataSource, EntitySubscriberInterface, EventSubscriber, RemoveEvent } from 'typeorm';
import { ContentTranslationsService } from './content-translations.service';
import { translatableOf } from './translatable.decorator';

@Injectable()
@EventSubscriber()
export class ContentTranslationsSubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource, private contentTranslations: ContentTranslationsService) {
    dataSource.subscribers.push(this);
  }

  async afterRemove(event: RemoveEvent<any>): Promise<void> {
    const meta = translatableOf(event.metadata.target as Function);

    if (!meta) return;

    const id = event.entityId ?? event.databaseEntity?.id ?? event.entity?.id;

    if (id === null || id === undefined || typeof id === 'object') return;

    await this.contentTranslations.remove(meta.entity, id as string | number);
  }
}
