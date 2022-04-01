import { VoteGift } from "src/game/cabinet/votes/entities/vote-gift.entity";
import { Connection } from "typeorm";
import { Seeder } from "typeorm-seeding";

export default class CreateVoteGifts implements Seeder {
  public async run(factory: any, connection: Connection): Promise<any> {
    await connection.getRepository(VoteGift).save([
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