import { defineAdminModule } from 'unicore-api/admin'

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
  })
})
