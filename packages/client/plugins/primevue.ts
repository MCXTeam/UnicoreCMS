import Vue from 'vue'

import PrimeVue from 'primevue/config'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import Avatar from 'primevue/avatar'

Vue.component('ProgressSpinner', ProgressSpinner)
Vue.component('Skeleton', Skeleton)
Vue.component('ProgressBar', ProgressBar)
Vue.component('Avatar', Avatar)

Vue.use(PrimeVue, {
  ripple: true,
  inputStyle: 'outlined',
})
