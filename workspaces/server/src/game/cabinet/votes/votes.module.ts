import { Module, OnModuleInit } from '@nestjs/common';
import { MctopModule } from './monitorings/mctop/mctop.module';
import { MinecraftRatingModule } from './monitorings/minecraftrating/minecraftrating.module';
import { TopcraftModule } from './monitorings/topcraft/topcraft.module';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

const register = [TopcraftModule, MctopModule, MinecraftRatingModule].filter(method => method.enabled)

@Module({
  imports: [...register],
  providers: [VotesService],
  controllers: [VotesController],
})
export class VotesModule implements OnModuleInit {
  constructor (private votesService: VotesService) {}

  onModuleInit() {
    this.votesService.setMonitorings(register.map(m => m.id))
  }
}
