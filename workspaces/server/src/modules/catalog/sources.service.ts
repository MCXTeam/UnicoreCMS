import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BUILTIN_EXTENSION_SOURCES, ExtensionKind, isGithubRepo } from 'unicore-common';
import { decryptField, encryptField, ENCRYPTED_SOURCE_TOKEN } from '@common';
import { ExtensionSourceDto } from './dto/extension-source.dto';
import { ExtensionSourceInput } from './dto/extension-source.input';
import { ExtensionSource } from './entities/extension-source.entity';

@Injectable()
export class ExtensionSourcesService implements OnModuleInit {
  constructor(@InjectRepository(ExtensionSource) private readonly sources: Repository<ExtensionSource>) {}

  async onModuleInit(): Promise<void> {
    for (const builtin of BUILTIN_EXTENSION_SOURCES) {
      const exists = await this.sources.findOneBy({ builtin: true, kind: builtin.kind, location: builtin.location });

      if (exists) continue;

      await this.sources.save(this.sources.create({ ...builtin, type: 'github', builtin: true, enabled: true }));
    }
  }

  async list(): Promise<ExtensionSourceDto[]> {
    return (await this.sources.find({ order: { builtin: 'DESC', id: 'ASC' } })).map((source) => new ExtensionSourceDto(source));
  }

  async enabled(kind: ExtensionKind): Promise<ExtensionSource[]> {
    return this.sources.find({ where: { kind, enabled: true }, order: { builtin: 'DESC', id: 'ASC' } });
  }

  async one(id: number): Promise<ExtensionSource> {
    const source = await this.sources.findOneBy({ id });

    if (!source) throw new NotFoundException();

    return source;
  }

  token(source: ExtensionSource): string | undefined {
    return source.token ? decryptField(source.token, ENCRYPTED_SOURCE_TOKEN, String(source.id)) : undefined;
  }

  async create(input: ExtensionSourceInput): Promise<ExtensionSourceDto> {
    this.assertLocation(input);

    const source = await this.sources.save(
      this.sources.create({
        name: input.name,
        kind: input.kind,
        type: input.type,
        location: input.location,
        builtin: false,
        enabled: input.enabled ?? true,
      }),
    );

    if (input.token) {
      source.token = encryptField(input.token, ENCRYPTED_SOURCE_TOKEN, String(source.id));
      await this.sources.save(source);
    }

    return new ExtensionSourceDto(source);
  }

  async update(id: number, input: ExtensionSourceInput): Promise<ExtensionSourceDto> {
    const source = await this.one(id);

    if (source.builtin) {
      source.name = input.name;
    } else {
      this.assertLocation(input);

      source.name = input.name;
      source.kind = input.kind;
      source.type = input.type;
      source.location = input.location;
    }

    source.enabled = input.enabled ?? source.enabled;

    if (input.token !== undefined) source.token = input.token ? encryptField(input.token, ENCRYPTED_SOURCE_TOKEN, String(source.id)) : null;

    return new ExtensionSourceDto(await this.sources.save(source));
  }

  async remove(id: number): Promise<{ removed: boolean }> {
    const source = await this.one(id);

    if (source.builtin) throw new BadRequestException('Встроенный источник удалить нельзя, его можно выключить');

    await this.sources.remove(source);

    return { removed: true };
  }

  private assertLocation(input: ExtensionSourceInput): void {
    if (input.type === 'github' && !isGithubRepo(input.location))
      throw new BadRequestException('Для GitHub укажите репозиторий в виде owner/repo');

    if (input.type === 'url') {
      let parsed: URL;

      try {
        parsed = new URL(input.location);
      } catch {
        throw new BadRequestException('Укажите полный адрес каталога, начиная с http:// или https://');
      }

      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
        throw new BadRequestException('Адрес каталога должен начинаться с http:// или https://');
    }
  }
}
