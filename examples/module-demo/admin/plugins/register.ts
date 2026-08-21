import { defineAdminModule } from 'unicore-api/admin'
import UserNotes from '../components/UserNotes.vue'

export default defineNuxtPlugin(() => {
  defineAdminModule({
    id: 'demo',
    menu: [
      {
        label: 'mod.demo.title',
        icon: 'pi pi-fw pi-book',
        to: '/mod/demo',
      },
    ],
    access: { '/mod/demo': ['mod.demo.read'] },
    slots: [{ slot: 'users.profile', component: UserNotes, order: 10 }],
  })
})
