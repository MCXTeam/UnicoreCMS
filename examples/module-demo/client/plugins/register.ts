import { defineClientModule } from 'unicore-api/client'
import FooterLinks from '../components/FooterLinks.vue'
import NewsNote from '../components/NewsNote.vue'
import ServerWidget from '../components/ServerWidget.vue'

export default defineNuxtPlugin(() => {
  defineClientModule({
    id: 'demo',
    nav: [
      { key: 'demo', to: '/mod/demo', label: 'mod.demo.title', icon: 'bx bx-book', places: ['navbar'], order: 50 },
      {
        key: 'demo.cabinet',
        to: '/mod/demo/cabinet',
        label: 'mod.demo.cabinet_tab',
        icon: 'bx bx-notepad',
        places: ['cabinet.tabs'],
        order: 95,
      },
    ],
    slots: [
      { slot: 'server.page', component: ServerWidget, order: 10 },
      { slot: 'news.page', component: NewsNote, order: 10 },
      { slot: 'footer', component: FooterLinks, order: 10 },
    ],
  })
})
