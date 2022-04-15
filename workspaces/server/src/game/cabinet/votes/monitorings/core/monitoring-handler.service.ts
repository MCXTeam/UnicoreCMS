import { MomentWrapper } from "@common";
import { Inject } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConfigField } from "src/admin/config/config.enum";
import { ConfigService } from "src/admin/config/config.service";
import { User } from "src/admin/users/entities/user.entity";
import { MoreThanOrEqual, Repository } from "typeorm";
import { Vote } from "../../entities/vote.entity";

export class MonitoringHandlerService {
  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    private configService: ConfigService,
    @InjectRepository(Vote) private votesRepo: Repository<Vote>,
    @InjectRepository(User) private usersRepo: Repository<User>,
  ) { }

  async handler(monitoring_id: string, username: string): Promise<boolean> {
    const cfg = await this.configService.load()
    const user = await this.usersRepo.findOne({ username })

    if (!user)
      return false

    if (cfg[ConfigField.VotesTwinkProtect] && this.votesRepo.findOne({ monitoring: monitoring_id, user, created: MoreThanOrEqual(this.moment().subtract(1, "day").toDate()) }, { relations: ["user"] }))
      return false

    user.virtual += Number(cfg[ConfigField.MonitoringReward])

    const vote = new Vote()
    vote.monitoring = monitoring_id
    vote.user = user

    await this.usersRepo.save(user)
    await this.votesRepo.save(vote)

    return true
  }
}