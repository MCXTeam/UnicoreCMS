import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VoteGift } from './entities/vote-gift.entity';
import { MctopModule } from './monitorings/mctop/mctop.module';
import { MinecraftRatingModule } from './monitorings/minecraftrating/minecraftrating.module';
import { TopcraftModule } from './monitorings/topcraft/topcraft.module';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

const register = [TopcraftModule, MctopModule, MinecraftRatingModule].filter(method => method.enabled)

@Module({
  imports: [...register, TypeOrmModule.forFeature([VoteGift])],
  providers: [VotesService],
  controllers: [VotesController],
})
export class VotesModule implements OnModuleInit {
  constructor (private votesService: VotesService) {}

  onModuleInit() {
    this.votesService.setMonitorings(register.map(m => m.id))
  }
}
