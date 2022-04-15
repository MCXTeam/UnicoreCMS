import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { ConfigField, ConfigType } from './config.enum';
import { ConfigInput } from './dto/config.input';
import { Config } from './entities/config.entity';
import * as _ from 'lodash';

@Injectable()
export class ConfigService {
  constructor(@InjectRepository(Config) private configRepo: Repository<Config>) {}

  private configTransformer(config: Config[]) {
    return config.map((cfg) => {
      if (!cfg.value) return cfg;
      else if (cfg.type == ConfigType.boolean) {
        if (cfg.value == 'false' || cfg.value == '0') return { ...cfg, value: false };
        else return { ...cfg, value: true };
      } else if (cfg.type == ConfigType.number) {
        return { ...cfg, value: Number(cfg.value) };
      } else {
        return cfg;
      }
    });
  }

  async init() {
    await this.configRepo
      .createQueryBuilder()
      .insert()
      .into(Config)
      .values([
        {
          key: ConfigField.EconomyRate,
          value: '100',
          important: true,
          type: ConfigType.number,
        },
        { key: ConfigField.LauncherExe, important: true, type: ConfigType.string },
        { key: ConfigField.LauncherJar, important: true, type: ConfigType.string },
        { key: ConfigField.LinkForum, important: true, type: ConfigType.string, value: "https://unicorecms.ru" },
        { key: ConfigField.LinkDiscord, important: true, type: ConfigType.string, value: "https://t.me/unicore_project" },
        { key: ConfigField.LinkTelegram, important: true, type: ConfigType.string, value: "https://t.me/unicore_project" },
        { key: ConfigField.LinkVk, important: true, type: ConfigType.string, value: "https://t.me/unicore_project" },
        { key: ConfigField.LinkYoutube, important: true, type: ConfigType.string, value: "https://t.me/unicore_project" },
        { key: ConfigField.ReferalTrigger, important: true, type: ConfigType.number, value: "600" },
        { key: ConfigField.ReferalReward, important: true, type: ConfigType.number, value: "20" },
        { key: ConfigField.ReferalRewardPlayer, important: true, type: ConfigType.number, value: "20" },
        { key: ConfigField.MonitoringReward, important: true, type: ConfigType.number, value: "2" },
        { key: ConfigField.LinkMctop, important: true, type: ConfigType.string, value: "https://unicorecms.ru" },
        { key: ConfigField.LinkMinecraftraiting, important: true, type: ConfigType.string, value: "https://unicorecms.ru" },
        { key: ConfigField.LinkTopcraft, important: true, type: ConfigType.string, value: "https://unicorecms.ru" },
        { key: ConfigField.UnbanPrice, important: true, type: ConfigType.number, value: "150" },
        { key: ConfigField.VirtualPercent, important: true, type: ConfigType.number, value: "75" },
        { key: ConfigField.VotesTwinkProtect, important: true, type: ConfigType.boolean, value: "true" },
        { key: ConfigField.StoreKitsVirtualUse, important: true, type: ConfigType.boolean, value: "true" },
        { key: ConfigField.StoreProductsVirtualUse, important: true, type: ConfigType.boolean, value: "true" },
        { key: ConfigField.DonateGroupsVirtualUse, important: true, type: ConfigType.boolean, value: "true" },
        { key: ConfigField.DonatePermsVirtualUse, important: true, type: ConfigType.boolean, value: "true" },
        { key: ConfigField.EmailActivationRequired, important: true, type: ConfigType.boolean, value: "true" },
        { key: ConfigField.OrdinaryRegister, important: true, type: ConfigType.boolean, value: "false" },
      ])
      .orIgnore()
      .execute();
  }

  async find() {
    return this.configTransformer(await this.configRepo.find({ order: { important: 'DESC' } }));
  }

  async load() {
    return _.chain(await this.find())
      .keyBy('key')
      .mapValues('value')
      .value();
  }

  async findPublic() {
    return _.chain((await this.find()).filter((c) => c.key.startsWith('public_')))
      .keyBy('key')
      .mapValues('value')
      .value();
  }

  async create(input: ConfigInput) {
    if (await this.configRepo.findOne(input.key)) throw new BadRequestException();

    const cfg = new Config();

    cfg.value = input.value;
    cfg.key = input.key;
    cfg.type = input.type;

    return this.configRepo.save(cfg);
  }

  async update(input: ConfigInput) {
    const cfg = await this.configRepo.findOne(input.key);

    if (!cfg) throw new NotFoundException();

    cfg.value = input.value;
    cfg.type = input.type;

    return this.configRepo.save(cfg);
  }

  async delate(key: string) {
    const cfg = await this.configRepo.findOne({ key, important: IsNull() });

    if (!cfg) throw new NotFoundException();

    return this.configRepo.remove(cfg);
  }
}
