import { defineClientModule } from 'unicore-api/client'

export default defineNuxtPlugin(() => {
  defineClientModule({
    id: 'demo',
    nav: [{ key: 'demo', to: '/mod/demo', label: 'mod.demo.title', icon: 'bx bx-book', places: ['navbar'], order: 50 }],
    slots: [{ slot: 'server.page', component: 'ModDemoServerWidget', order: 10 }],
  })
})
