import { Bonus } from "src/payment/bonuses/entities/bonus.entity";
import { Connection } from "typeorm";
import { Seeder } from "typeorm-seeding";

export default class CreateBonuses implements Seeder {
  public async run(factory: any, connection: Connection): Promise<any> {
    await connection.getRepository(Bonus).save([
      {
        bonus: 5,
        amount: 1000,
        icon: 'default/monets-1.png'
      },
      {
        bonus: 10,
        amount: 2000,
        icon: 'default/monets-2.png'
      },
      {
        bonus: 20,
        amount: 3000,
        icon: 'default/monets-3.png'
      },
      {
        bonus: 25,
        amount: 5000,
        icon: 'default/monets-4.png'
      },
    ]);
  }
}