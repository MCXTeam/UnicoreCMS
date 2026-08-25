import { defineAdminModule } from 'unicore-api/admin'

export default defineNuxtPlugin(() => {
  defineAdminModule({
    id: 'team',
    menu: [{ label: 'mod.team.page_title', icon: 'pi pi-fw pi-users', to: '/mod/team' }],
    access: { '/mod/team': ['mod.team.read'] },
  })
})
