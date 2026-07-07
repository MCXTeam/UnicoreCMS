// @ts-ignore
import AOS from 'aos'
import 'aos/dist/aos.css'

export default defineNuxtPlugin(() => {
  AOS.init({
    disable: 'mobile',
    once: true,
  })
})
