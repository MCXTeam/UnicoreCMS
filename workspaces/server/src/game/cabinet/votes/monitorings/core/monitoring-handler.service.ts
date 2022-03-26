import { InjectRepository } from "@nestjs/typeorm";
import { ConfigField } from "src/admin/config/config.enum";
import { ConfigService } from "src/admin/config/config.service";
import { User } from "src/admin/users/entities/user.entity";
import { Repository } from "typeorm";
import { Vote } from "../../entities/vote.entity";

export class MonitoringHandlerService {
  constructor(
    private configService: ConfigService,
    @InjectRepository(Vote) private votesRepo: Repository<Vote>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) { }

  async handler(monitoring_id: string, username: string): Promise<boolean> {
    const cfg = await this.configService.load()
    const user = await this.usersRepo.findOne({ username })

    if (!user)
      return false

    user.real += Number(cfg[ConfigField.MonitoringReward])

    const vote = new Vote()
    vote.monitoring = monitoring_id
    vote.user = user

    await this.usersRepo.save(user)
    await this.votesRepo.save(vote)

    return true
  }
}