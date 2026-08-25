import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { core } from 'unicore-api'
import { Permissions, Public } from 'unicore-api/server'
import { TeamNoteInput } from './dto/note.input'
import { TeamService } from './team.service'

@Controller('mod/team')
export class TeamController {
  constructor(private readonly service: TeamService) {}

  @Public()
  @Get()
  async sections() {
    const title = (await core().config.get('public_mod_team_global')) || 'На всех серверах'

    return this.service.sections(title)
  }

  @Permissions(['mod.team.read'])
  @Get('members')
  members() {
    return this.service.list()
  }

  @Permissions(['mod.team.write'])
  @Patch('members/:uuid')
  saveNote(@Param('uuid') uuid: string, @Body() body: TeamNoteInput) {
    return this.service.saveNote(uuid, body)
  }
}
