import { defineAdminModule } from 'unicore-api/admin'

export default defineNuxtPlugin(() => {
  defineAdminModule({
    id: 'forms',
    menu: [
      {
        label: 'mod.forms.title',
        icon: 'pi pi-fw pi-file-edit',
        items: [
          { label: 'mod.forms.menu_builder', icon: 'pi pi-fw pi-pencil', to: '/mod/forms' },
          { label: 'mod.forms.inbox', icon: 'pi pi-fw pi-inbox', to: '/mod/forms/inbox' },
        ],
      },
    ],
    access: {
      '/mod/forms': ['mod.forms.read'],
      '/mod/forms/inbox': ['mod.forms.read'],
    },
  })
})
