<template>
  <div class="vh-100 vw-100 d-flex align-items-center justify-content-center auth-layout">
    <div v-for="(n, index) in 15" :key="index" class="firefly d-none d-xl-block" />
    <div data-aos-delay="50" data-aos="fade-left" class="panel d-flex flex-column align-items-center px-5">
      <nuxt-link data-aos="zoom-in-right" to="/">
        <img src="/icon.png" :alt="$config.sitename" height="128px" />
      </nuxt-link>
      <nuxt-child />
    </div>
    <img
      data-aos-anchor="body"
      data-aos-delay="300"
      data-aos="fade-left"
      class="header-render d-none d-lg-block"
      src="/images/render.png"
    />
  </div>
</template>

<script>
export default {
  middleware: ['guest'],

  head: {
    bodyAttrs: {
      class: 'auth-body',
    },
  },

  head: {
    title: 'Авторизация',
  },

  async mounted() {
    if (this.$auth.loggedIn)

    try {
      await this.$recaptcha.init()
    } catch (e) {
      console.error(e)
    }
  },
  beforeDestroy() {
    this.$recaptcha.destroy()
  },
}
</script>
