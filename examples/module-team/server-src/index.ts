import { defineModule } from 'unicore-api/server'
import { TeamNote } from './entities/note.entity'
import { TeamModule } from './team.module'
import ru from '../locales/ru.json'
import en from '../locales/en.json'

export default defineModule({
  id: 'team',
  entities: [TeamNote],
  nestModules: [TeamModule],
  permissions: ['mod.team.read', 'mod.team.write'],
  config: [
    {
      key: 'title',
      type: 'string',
      default: 'Команда проекта',
      public: true,
      label: 'mod.team.config_title',
      hint: 'mod.team.config_title_hint',
    },
    {
      key: 'subtitle',
      type: 'string',
      default: 'Люди, которые делают проект',
      public: true,
      label: 'mod.team.config_subtitle',
      hint: 'mod.team.config_subtitle_hint',
    },
    {
      key: 'global',
      type: 'string',
      default: 'На всех серверах',
      public: true,
      label: 'mod.team.config_global',
      hint: 'mod.team.config_global_hint',
    },
  ],
  locales: { ru, en },
})
