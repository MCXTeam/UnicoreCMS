import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TeamNote } from './entities/note.entity'
import { TeamController } from './team.controller'
import { TeamService } from './team.service'

@Module({
  imports: [TypeOrmModule.forFeature([TeamNote])],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
