import { StorageManager } from '@common';
import faker from '@faker-js/faker';
import { readFileSync } from 'fs';
import * as JSZip from 'jszip';
import * as _ from 'lodash';
import { Period } from 'src/game/donate/entities/period.entity';
import { DonateGroup } from 'src/game/donate/groups/entities/donate-group.entity';
import { GroupKit } from 'src/game/donate/groups/entities/group-kit.entity';
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
    } catch (_) {}

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

    // const groupKits = await connection.getRepository(GroupKit).save([
    //   {
    //     name: "VIP"
    //   },
    // ])

    // await connection.getRepository(DonateGroup).save([
    //   {
    //     ingame_id: "vip",
    //     name: "Vip",
    //     price: 100,
    //     servers: servers_,
    //     periods: periods
    //   }
    // ])
  }
}
