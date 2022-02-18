<template>
  <div class="vh-100 vw-100 d-flex align-items-center justify-content-center auth-layout">
    <div data-aos-delay="50" data-aos="fade-left" class="panel d-flex flex-column align-items-center px-5">
      <nuxt-link data-aos="zoom-in-right" to="/">
        <img class="mb-4" src="/icon.png" height="128px" />
      </nuxt-link>
      <nuxt-child />
    </div>
    <img data-aos-anchor="body" data-aos-delay="300" data-aos="fade-left" class="header-render d-none d-lg-block" src="/images/render.png" />
  </div>
</template>

<script>
export default {
  async mounted() {
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
