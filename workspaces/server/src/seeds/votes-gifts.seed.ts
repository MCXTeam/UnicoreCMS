import { VoteGift } from 'src/game/cabinet/votes/entities/vote-gift.entity';
import { DataSource } from 'typeorm';

export default class CreateVoteGifts {
  public async run(dataSource: DataSource): Promise<any> {
    await dataSource.getRepository(VoteGift).save([
      {
        bonus: 350,
        place: 1,
      },
      {
        bonus: 250,
        place: 2,
      },
      {
        bonus: 150,
        place: 3,
      },
      {
        bonus: 100,
        place: 4,
      },
      {
        bonus: 50,
        place: 5,
      },
    ]);
  }
}
