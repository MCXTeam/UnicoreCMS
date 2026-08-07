import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { ContentTranslation } from './entities/content-translation.entity';
import { isAllowedPath, setPath, translatableByEntity, TranslatableMeta } from './translatable.decorator';

export type TranslationsPayload = Record<string, Record<string, string>>;

@Injectable()
export class ContentTranslationsService {
  constructor(
    @InjectRepository(ContentTranslation)
    private translationsRepository: Repository<ContentTranslation>,
  ) {}

  async find(entity: string, id: string | number): Promise<TranslationsPayload> {
    const rows = await this.translationsRepository.findBy({ entity, entityId: String(id) });

    return rows.reduce((result, row) => {
      result[row.localeCode] = result[row.localeCode] || {};
      result[row.localeCode][row.path] = row.value;

      return result;
    }, {} as TranslationsPayload);
  }

  async save(entity: string, id: string | number, payload?: TranslationsPayload): Promise<void> {
    const meta = translatableByEntity(entity);

    if (!meta || !payload) return;

    const entityId = String(id);
    const values: ContentTranslation[] = [];
    const empty: ContentTranslation[] = [];

    for (const [localeCode, paths] of Object.entries(payload)) {
      for (const [path, value] of Object.entries(paths || {})) {
        if (!isAllowedPath(meta, path)) continue;

        const row = { localeCode, entity, entityId, path, value } as ContentTranslation;

        if (value === null || value === undefined || value === '') empty.push(row);
        else values.push(row);
      }
    }

    if (values.length) await this.translationsRepository.upsert(values, ['localeCode', 'entity', 'entityId', 'path']);

    for (const row of empty) {
      await this.translationsRepository.delete({
        localeCode: row.localeCode,
        entity: row.entity,
        entityId: row.entityId,
        path: row.path,
      });
    }
  }

  async remove(entity: string, id: string | number): Promise<void> {
    await this.translationsRepository.delete({ entity, entityId: String(id) });
  }

  async removeMany(entity: string, ids: Array<string | number>): Promise<void> {
    if (!ids.length) return;

    await this.translationsRepository.delete({ entity, entityId: In(ids.map(String)) });
  }

  async overlay(localeCode: string, targets: Map<string, Map<string, any[]>>): Promise<void> {
    if (!targets.size) return;

    const query = this.translationsRepository
      .createQueryBuilder('t')
      .select(['t.entity', 't.entityId', 't.path', 't.value'])
      .where('t.localeCode = :localeCode', { localeCode });

    query.andWhere(
      new Brackets((qb) => {
        let index = 0;

        for (const [entity, byId] of targets) {
          qb.orWhere(`(t.entity = :entity${index} AND t.entityId IN (:...ids${index}))`, {
            [`entity${index}`]: entity,
            [`ids${index}`]: [...byId.keys()],
          });

          index++;
        }
      }),
    );

    const rows = await query.getMany();

    for (const row of rows) {
      const objects = targets.get(row.entity)?.get(row.entityId);

      if (!objects) continue;

      for (const object of objects) setPath(object, row.path, row.value);
    }
  }

  async localize<T extends Record<string, any>>(entity: string, id: string | number, localeCode: string | null, target: T): Promise<T> {
    if (!localeCode || !target) return target;

    await this.overlay(localeCode, new Map([[entity, new Map([[String(id), [target]]])]]));

    return target;
  }

  allowed(meta: TranslatableMeta, path: string): boolean {
    return isAllowedPath(meta, path);
  }
}
