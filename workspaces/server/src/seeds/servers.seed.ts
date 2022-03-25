import { StorageManager } from '@common';
import faker from '@faker-js/faker';
import { readFileSync } from 'fs';
import * as JSZip from 'jszip';
import * as _ from 'lodash';
import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { GroupKit } from 'src/game/donate/groups/entities/group-kit.entity';
import { DonatePermission } from 'src/game/donate/permissions/entities/donate-permission.entity';
import { PermissionType } from 'src/game/donate/permissions/enums/permission-type.enum';
import { ServerTableDto } from 'src/game/servers/dto/server-table.dto';
import { Server } from 'src/game/servers/entities/server.entity';
import { Mod } from 'src/game/servers/mods/entities/mod.entity';
import { Online } from 'src/game/servers/online/entities/online.entity';
import { Query } from 'src/game/servers/online/entities/query.entity';
import { Category } from 'src/game/store/entities/category.entity';
import { KitItem } from 'src/game/store/entities/kit-item.entity';
import { Kit } from 'src/game/store/entities/kit.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { ProductMap } from 'src/game/store/providers/product.service';
import { Connection } from 'typeorm';
import { Seeder } from 'typeorm-seeding';
import { Permission } from 'unicore-common';

export default class CreateServers implements Seeder {
  public async run(factory: any, connection: Connection): Promise<any> {
    const hitechMods = await connection.getRepository(Mod).save([
      {
        name: 'Applied Energistics 2',
        description: faker.lorem.text(),
        icon: 'default/mods/ae2.gif',
      },
      {
        name: 'Ender IO',
        description: faker.lorem.text(),
        icon: 'default/mods/enderio.png',
      },
      {
        name: 'Mekanism',
        description: faker.lorem.text(),
        icon: 'default/mods/mekanism.jpeg',
      },
      {
        name: 'Industrial Foregoing',
        description: faker.lorem.text(),
        icon: 'default/mods/industrial-foregoing.png',
      },
    ]);
    const technomagicMods = await connection.getRepository(Mod).save([
      {
        name: 'Avarita',
        description: faker.lorem.text(),
        icon: 'default/mods/avarita.png',
      },
      {
        name: 'Botania',
        description: faker.lorem.text(),
        icon: 'default/mods/botania.png',
      },
      {
        name: 'Draconic Evolution',
        description: faker.lorem.text(),
        icon: 'default/mods/draconic-evolution.png',
      },
    ]);
    const skytechMods = await connection.getRepository(Mod).save([
      {
        name: 'ExNihilo',
        description: faker.lorem.text(),
        icon: 'default/mods/exnihilo.png',
      },
    ]);

    const table: ServerTableDto[] = [
      {
        title: 'Режим сражений',
        description: 'PvP',
      },
      {
        title: 'Размер основного мира',
        description: '15000 блоков',
      },
      {
        title: 'Размер доп. миров',
        description: '5000 блоков',
      },
      {
        title: 'Вайп доп. миров каждые',
        description: '14 дней',
      },
    ];

    const servers = [
      {
        id: 'hitech',
        icon: 'default/hitech-icon.png',
        image: 'default/hitech-image.png',
        name: 'HiTech',
        slogan: 'Мир в котором можно всё',
        content: faker.lorem.text(),
        version: '1.12.2',
        table,
        mods: hitechMods,
      },
      {
        id: 'technomagic',
        icon: 'default/technomagic-icon.png',
        image: 'default/technomagic-image.jpg',
        name: 'TechnoMagic',
        slogan: 'Мир в котором можно всё',
        content: faker.lorem.text(),
        version: '1.12.2',
        table,
        mods: [...hitechMods, ...technomagicMods],
      },
      {
        id: 'skytech',
        icon: 'default/skytech-icon.png',
        image: 'default/skytech-image.png',
        name: 'SkyTech',
        slogan: 'Мир в котором можно всё',
        content: faker.lorem.text(),
        version: '1.12.2',
        table,
        mods: [...hitechMods, ...skytechMods],
      },
    ];

    const queries = [
      {
        host: '127.0.0.1',
        port: 25565,
        server: servers[0],
      },
      {
        host: '127.0.0.1',
        port: 25565,
        server: servers[1],
      },
      {
        host: '127.0.0.1',
        port: 25565,
        server: servers[2],
      },
    ];

    const onlines = [{ server: servers[0] }, { server: servers[1] }, { server: servers[2] }];

    const servers_ = await connection.getRepository(Server).save(servers);
    await connection.createQueryBuilder().insert().into(Query).values(queries).execute();
    await connection.createQueryBuilder().insert().into(Online).values(onlines).execute();
    const categories = await connection.getRepository(Category).save([
      {
        name: 'Minecraft',
        icon: 'default/minecraft.png',
      },
    ]);

    try {
      const fileBuffer = readFileSync('./../../compat/Vanilla-export.zip');
      const zipTree = await JSZip.loadAsync(fileBuffer);
      const content = await zipTree.file('content.json').async('string');
      const mapping: ProductMap[] = JSON.parse(content);
      const products: Product[] = [];

      await Promise.all(
        mapping.map(async (product, index) => {
          const entity = new Product();

          entity.name = product.name;
          entity.description = product.description;
          entity.nbt = product.nbt;
          entity.price = product.price;
          entity.sale = product.sale;
          entity.item_id = product.item_id;
          entity.servers = servers_;
          entity.categories = categories;

          if (product.icon) {
            const iconBuff = await zipTree.file('storage/' + product.icon).async('nodebuffer');
            if (iconBuff) entity.icon = StorageManager.save(product.icon, iconBuff);
          }

          products.push(entity);
        }),
      );

      const productsEntities = await connection.getRepository(Product).save(products);

      await connection.getRepository(Kit).save([
        {
          name: 'Ресурсы',
          icon: 'default/minecraft.png',
          servers: servers_,
          categories: categories,
          items: [
            {
              product: productsEntities.find((p) => p.item_id == 'minecraft:iron_ingot'),
              amount: 32,
            },
            {
              product: productsEntities.find((p) => p.item_id == 'minecraft:gold_ingot'),
              amount: 16,
            },
            {
              product: productsEntities.find((p) => p.item_id == 'minecraft:diamond'),
              amount: 8,
            },
            {
              product: productsEntities.find((p) => p.item_id == 'minecraft:emerald'),
              amount: 8,
            },
          ],
          price: 25,
        },
      ]);
    } catch (_) { }

    const periods = await connection.getRepository(Period).save([
      {
        name: '1 месяц',
        expire: 2592000,
        multiplier: 1,
      },
      {
        name: '2 месяца',
        expire: 5184000,
        multiplier: 1.9,
      },
      {
        name: '3 месяца',
        expire: 7776000,
        multiplier: 2.7,
      },
      {
        name: 'Навсегда',
        expire: 0,
        multiplier: 10,
      },
    ]);

    const groupKits = await connection.getRepository(GroupKit).save([
      {
        name: "VIP",
        description: "Можно выдать раз в 30 дней (/kit vip)",
        images: servers_.map(srv => ({
          server: srv,
          image: "default/vip_kit.png"
        })),
      },
      {
        name: "Premium",
        description: "Можно выдать раз в 30 дней (/kit premium)",
        images: servers_.map(srv => ({
          server: srv,
          image: "default/premium_kit.png"
        })),
      },
      {
        name: "Elite",
        description: "Можно выдать раз в 30 дней (/kit elite)",
        images: servers_.map(srv => ({
          server: srv,
          image: "default/elite_kit.png"
        })),
      },
    ])

    await connection.getRepository(DonateGroup).save([
      {
        ingame_id: "vip",
        name: "Vip",
        icon: "default/vip.png",
        price: 100,
        sale: 10,
        kits: groupKits.filter(kit => kit.name == 'VIP'),
        servers: servers_,
        periods: periods,
        features: [
          {
            title: "150 тыс. блоков",
            desciption: "Максимальный размер региона, который Вы можете заприватить"
          },
          {
            title: "4 региона",
            desciption: "Максимальное число приватов, которые Вы можете создать"
          },
          {
            title: "Набор флагов VIP",
            desciption: "Creeper-explosion, ghast-fireball, snow-fall, ice-form, ice-melt и leaf-decay"
          },
          {
            title: "/tpahere",
            desciption: "Телепортировать игрока к себе"
          },
          {
            title: "/back",
            desciption: "Вернуться на точку смерти"
          },
          {
            title: "/fly",
            desciption: "Включить режим полёта"
          },
          {
            title: "Резервный слот",
            desciption: "Вход на заполенный сервер"
          },
          {
            title: "/near",
            desciption: "Вывести список всех игроков в радиусе 200 блоков"
          },
          {
            title: "/heal",
            desciption: "Полностью восстановить Вашу шкалу здоровья"
          },
        ]
      },
      {
        ingame_id: "premium",
        name: "Premium",
        icon: "default/premium.png",
        price: 100,
        sale: 10,
        kits: groupKits.filter(kit => kit.name == 'Premium'),
        servers: servers_,
        periods: periods,
        features: [
          {
            title: "Всё включено!",
            desciption: "Все возможности VIP!"
          },
          {
            title: "150 тыс. блоков",
            desciption: "Максимальный размер региона, который Вы можете заприватить"
          },
          {
            title: "6 регионов",
            desciption: "Максимальное число приватов, которые Вы можете создать"
          },
          {
            title: "Флаги Premium",
            desciption: "mob-spawning, mob-damage, lava-fire, deny-spawn и все флаги группы VIP"
          },
          {
            title: "/hat",
            desciption: "Надеть на голову тот блок или предмет, который Вы держите в руке"
          },
          {
            title: "Приватный варп",
            desciption: "Доступна 1 приватная точка телепортирования (warp)"
          },
          {
            title: "Смена плаща HD",
            desciption: "Можно установить плащ высокого качества"
          },
          {
            title: "Смена скина HD",
            desciption: "Можно установить скин высокого качества"
          },
          {
            title: "Цвет на табличках",
            desciption: "Можно писать разными цветами на табличках"
          },
        ]
      },
      {
        ingame_id: "elite",
        name: "Elite",
        icon: "default/elite.png",
        price: 100,
        sale: 10,
        kits: groupKits.filter(kit => kit.name == 'Elite'),
        servers: servers_,
        periods: periods,
        web_perms: [Permission.UserCabinetSkinHd, Permission.UserCabinetCloakHd],
        features: [
          {
            title: "Всё включено!",
            desciption: "Все возможности Premium!"
          },
          {
            title: "200 тыс. блоков",
            desciption: "Максимальный размер региона, который Вы можете заприватить"
          },
          {
            title: "8 регионов",
            desciption: "Максимальное число приватов, которые Вы можете создать"
          },
          {
            title: "Флаги Deluxe",
            desciption: "invincible, feed-min-hunger, feed-max-hunger, water-flow, lava-flow, entry и все флаги групп VIP и PREMIUM"
          },
          {
            title: "/getpos",
            desciption: "Получить данные о Вашем местоположении"
          },
          {
            title: "/jumpto",
            desciption: "Прыгнуть туда, куда Вы смотрите"
          },
          {
            title: "/ext",
            desciption: "Мгновенно потушить себя"
          },
          {
            title: "/ext [игрок]",
            desciption: "Потушить другого игрока"
          },
          {
            title: "/heal [игрок]",
            desciption: "Вылечить другого игрока"
          },
        ]
      }
    ])

    await connection.getRepository(DonatePermission).save([
      {
        name: "Загрузка HD-скина",
        type: PermissionType.Web,
        price: 5,
        sale: 5,
        web_perms: [Permission.UserCabinetSkinHd],
        periods: periods.filter(p => p.expire == 0)
      },
      {
        name: "Загрузка HD-плаща",
        type: PermissionType.Web,
        price: 5,
        sale: 5,
        web_perms: [Permission.UserCabinetCloakHd],
        periods: periods.filter(p => p.expire == 0)
      },
      {
        name: "Сохранение инвентаря",
        description: "Позволяет использовать команду /fly",
        type: PermissionType.Game,
        price: 20,
        sale: 5,
        perms: ['inventorykeep'],
        periods: periods,
        servers: servers_
      },
      {
        name: "Полёт",
        description: "Позволяет использовать команду /fly",
        type: PermissionType.Game,
        price: 20,
        sale: 5,
        perms: ['essentials.fly'],
        periods: periods,
        servers: servers_
      },
      {
        name: "Восстановление здоровья",
        description: "Позволяет использовать команду /heal",
        type: PermissionType.Game,
        price: 20,
        sale: 5,
        perms: ['essentials.heal'],
        periods: periods,
        servers: servers_
      },
      {
        name: "Кит Vip",
        type: PermissionType.Kit,
        price: 35,
        sale: 5,
        perms: ['essentials.kit.vip'],
        periods: periods,
        servers: servers_,
        kits: groupKits.filter(kit => kit.name == 'VIP')
      },
    ])
  }
}
