import faker from '@faker-js/faker';
import * as _ from 'lodash';
import { ServerTableDto } from 'src/game/servers/dto/server-table.dto';
import { Server } from 'src/game/servers/entities/server.entity';
import { Mod } from 'src/game/servers/mods/entities/mod.entity';
import { Online } from 'src/game/servers/online/entities/online.entity';
import { Query } from 'src/game/servers/online/entities/query.entity';
import { Category } from 'src/game/store/entities/category.entity';
import { Product } from 'src/game/store/entities/product.entity';
import { Connection } from "typeorm";
import { Seeder } from "typeorm-seeding";
import products from './products.json'

export default class CreateServers implements Seeder {
  public async run(factory: any, connection: Connection): Promise<any> {
    const hitechMods = await connection.getRepository(Mod).save([
      {
        name: "Applied Energistics 2",
        description: faker.lorem.text(),
        icon: "default/mods/ae2.gif"
      },
      {
        name: "Ender IO",
        description: faker.lorem.text(),
        icon: "default/mods/enderio.png"
      },
      {
        name: "Mekanism",
        description: faker.lorem.text(),
        icon: "default/mods/mekanism.jpeg"
      },
      {
        name: "Industrial Foregoing",
        description: faker.lorem.text(),
        icon: "default/mods/industrial-foregoing.png"
      },
    ])
    const technomagicMods = await connection.getRepository(Mod).save([
      {
        name: "Avarita",
        description: faker.lorem.text(),
        icon: "default/mods/avarita.png"
      },
      {
        name: "Botania",
        description: faker.lorem.text(),
        icon: "default/mods/botania.png"
      },
      {
        name: "Draconic Evolution",
        description: faker.lorem.text(),
        icon: "default/mods/draconic-evolution.png"
      },
    ])
    const skytechMods = await connection.getRepository(Mod).save([
      {
        name: "ExNihilo",
        description: faker.lorem.text(),
        icon: "default/mods/exnihilo.png"
      }
    ])

    const table: ServerTableDto[] = [
      {
        title: "Режим сражений",
        description: "PvP"
      },
      {
        title: "Размер основного мира",
        description: "15000 блоков"
      },
      {
        title: "Размер доп. миров",
        description: "5000 блоков"
      },
      {
        title: "Вайп доп. миров каждые",
        description: "14 дней"
      },
    ]

    const servers = [
      {
        id: "hitech",
        icon: "default/hitech-icon.png",
        image: "default/hitech-image.png",
        name: "HiTech",
        slogan: "Мир в котором можно всё",
        content: faker.lorem.text(),
        version: "1.12.2",
        table,
        mods: hitechMods
      },
      {
        id: "technomagic",
        icon: "default/technomagic-icon.png",
        image: "default/technomagic-image.jpg",
        name: "TechnoMagic",
        slogan: "Мир в котором можно всё",
        content: faker.lorem.text(),
        version: "1.12.2",
        table,
        mods: [...hitechMods, ...technomagicMods]
      },
      {
        id: "skytech",
        icon: "default/skytech-icon.png",
        image: "default/skytech-image.png",
        name: "SkyTech",
        slogan: "Мир в котором можно всё",
        content: faker.lorem.text(),
        version: "1.12.2",
        table,
        mods: [...hitechMods, ...skytechMods]
      }
    ]

    const queries = [
      {
        host: "127.0.0.1",
        port: 25565,
        server: servers[0]
      },
      {
        host: "127.0.0.1",
        port: 25565,
        server: servers[1]
      },
      {
        host: "127.0.0.1",
        port: 25565,
        server: servers[2]
      }
    ]

    const onlines = [
      { server: servers[0] },
      { server: servers[1] },
      { server: servers[2] }
    ]

    await connection.getRepository(Server).save(servers);
    await connection.createQueryBuilder().insert().into(Query).values(queries).execute();
    await connection.createQueryBuilder().insert().into(Online).values(onlines).execute();

    // Products
    // const categories = await connection.getRepository(Category).save([{
    //   name: "Minecraft",
    //   icon: "default/store/minecraft.png"
    // }]);

    // const products = [
    //   {
    //     name: "",
    //     icon: "",
    //     price: 0,
    //     item_id: "",
    //     categories, servers
    //   },
    // ]

    // connection.getRepository(Product).save(products)
  }
}