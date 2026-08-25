import { defineClientModule } from 'unicore-api/client'

export default defineNuxtPlugin(() => {
  defineClientModule({
    id: 'team',
    nav: [{ key: 'team', to: '/mod/team', label: 'mod.team.title', icon: 'bx bx-group', places: ['navbar', 'footer'], order: 60 }],
  })
})
