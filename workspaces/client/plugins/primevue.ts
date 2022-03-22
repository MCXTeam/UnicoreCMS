import Vue from 'vue'

import ConfirmationService from 'primevue/confirmationservice'
import PrimeVue from 'primevue/config'
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'
import Skeleton from 'primevue/skeleton'
import Avatar from 'primevue/avatar'
import Dropdown from 'primevue/dropdown'
import ConfirmDialog from 'primevue/confirmdialog'
import Slider from 'primevue/slider'

Vue.use(ConfirmationService)

Vue.component('ProgressSpinner', ProgressSpinner)
Vue.component('Skeleton', Skeleton)
Vue.component('ProgressBar', ProgressBar)
Vue.component('Avatar', Avatar)
Vue.component('Dropdown', Dropdown)
Vue.component('ConfirmDialog', ConfirmDialog)
Vue.component('Slider', Slider)

Vue.use(PrimeVue, {
  ripple: true,
  inputStyle: 'outlined',
})
