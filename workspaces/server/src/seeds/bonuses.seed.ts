import { Bonus } from 'src/payment/bonuses/entities/bonus.entity';
import { DataSource } from 'typeorm';

export default class CreateBonuses {
  public async run(dataSource: DataSource): Promise<any> {
    await dataSource.getRepository(Bonus).save([
      {
        bonus: 5,
        amount: 1000,
        icon: 'default/monets-1.png',
      },
      {
        bonus: 10,
        amount: 2000,
        icon: 'default/monets-2.png',
      },
      {
        bonus: 20,
        amount: 3000,
        icon: 'default/monets-3.png',
      },
      {
        bonus: 25,
        amount: 5000,
        icon: 'default/monets-4.png',
      },
    ]);
  }
}
