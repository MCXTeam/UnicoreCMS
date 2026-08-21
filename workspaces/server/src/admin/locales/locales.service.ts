import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { DEFAULT_LOCALES, LocaleCode } from 'unicore-common';
import { LocaleInput } from './dto/locale.input';
import { TranslationsInput } from './dto/translations.input';
import { Locale } from './entities/locale.entity';
import { Translation } from './entities/translation.entity';
import { moduleLocales } from 'src/modules/runtime';
import { activeThemeLocales } from 'src/modules/runtime/themes';
import * as ru from 'src/seeds/locales/ru.json';
import * as en from 'src/seeds/locales/en.json';

const SEEDS: Record<LocaleCode, Record<string, string>> = {
  ru: ru as unknown as Record<string, string>,
  en: en as unknown as Record<string, string>,
};

@Injectable()
export class LocalesService {
  constructor(
    @InjectRepository(Locale)
    private localesRepository: Repository<Locale>,
    @InjectRepository(Translation)
    private translationsRepository: Repository<Translation>,
  ) {}

  private defaultCodeCache: string | null = null;

  async init(): Promise<void> {
    await this.localesRepository.createQueryBuilder().insert().into(Locale).values(DEFAULT_LOCALES).orIgnore().execute();

    for (const [code, messages] of Object.entries(SEEDS)) {
      const values = Object.entries(messages).map(([key, value]) => ({ localeCode: code, key, value }));

      if (values.length) {
        await this.translationsRepository.createQueryBuilder().insert().into(Translation).values(values).orIgnore().execute();
      }
    }

    await this.seedModules();
    await this.seedTheme();
  }

  private async seedModules(): Promise<void> {
    for (const module of moduleLocales())
      for (const [code, messages] of Object.entries(module.locales)) {
        const values = Object.entries(messages).map(([key, value]) => ({ localeCode: code, key, value }));

        if (values.length)
          await this.translationsRepository.createQueryBuilder().insert().into(Translation).values(values).orIgnore().execute();
      }
  }

  private async seedTheme(): Promise<void> {
    for (const [code, messages] of Object.entries(activeThemeLocales())) {
      const values = Object.entries(messages).map(([key, value]) => ({ localeCode: code, key, value }));

      if (values.length)
        await this.translationsRepository.createQueryBuilder().insert().into(Translation).values(values).orIgnore().execute();
    }
  }

  async defaultCode(): Promise<string> {
    if (!this.defaultCodeCache) {
      const locale = await this.localesRepository.findOneBy({ is_default: true });

      this.defaultCodeCache = locale?.code || DEFAULT_LOCALES[0].code;
    }

    return this.defaultCodeCache;
  }

  find(): Promise<Locale[]> {
    return this.localesRepository.find();
  }

  findEnabled(): Promise<Locale[]> {
    return this.localesRepository.findBy({ enabled: true });
  }

  async messages(code: string): Promise<Record<string, string>> {
    const translations = await this.translationsRepository.findBy({ localeCode: code });

    return translations.reduce((result, translation) => {
      result[translation.key] = translation.value;

      return result;
    }, {} as Record<string, string>);
  }

  async keys(): Promise<string[]> {
    const rows = await this.translationsRepository.createQueryBuilder('t').select('DISTINCT t.translation_key', 'key').getRawMany();

    return rows.map((row) => row.key).sort();
  }

  async create(input: LocaleInput): Promise<Locale> {
    if (await this.localesRepository.findOneBy({ code: input.code })) throw new ConflictException();

    return this.save(this.localesRepository.create(input));
  }

  async update(code: string, input: LocaleInput): Promise<Locale> {
    const locale = await this.localesRepository.findOneBy({ code });

    if (!locale) throw new NotFoundException();

    return this.save(Object.assign(locale, input, { code }));
  }

  async remove(code: string): Promise<Locale> {
    const locale = await this.localesRepository.findOneBy({ code });

    if (!locale) throw new NotFoundException();

    if (locale.is_default) throw new ConflictException();

    this.defaultCodeCache = null;

    return this.localesRepository.remove(locale);
  }

  async saveTranslations(code: string, input: TranslationsInput): Promise<void> {
    const locale = await this.localesRepository.findOneBy({ code });

    if (!locale) throw new NotFoundException();

    const values = Object.entries(input.messages).map(([key, value]) => ({ localeCode: code, key, value }));

    if (!values.length) return;

    await this.translationsRepository.upsert(values, ['localeCode', 'key']);
  }

  async removeKey(key: string): Promise<void> {
    await this.translationsRepository.delete({ key });
  }

  private async save(locale: Locale): Promise<Locale> {
    this.defaultCodeCache = null;

    if (locale.is_default) {
      await this.localesRepository.update({ is_default: true }, { is_default: false });
      locale.enabled = true;
    }

    return this.localesRepository.save(locale);
  }
}
