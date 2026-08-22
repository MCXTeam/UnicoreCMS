<template>
  <canvas ref="viewer" />
</template>

<script>
export default {
  setup() {
    const rc = useRuntimeConfig()
    return { rc: rc.public }
  },
  props: {
    width: {
      type: Number,
      default: 300,
    },
    height: {
      type: Number,
      default: 400,
    },
    skin: Object,
    cloak: Object,
  },

  data() {
    return {
      viewer: null,
      ready: null,
      library: null,
      unmounted: false,
    }
  },

  watch: {
    skin: {
      handler: function () {
        this.loadSkin()
      },
      deep: true,
    },
    cloak: {
      handler: function () {
        this.loadCloak()
      },
      deep: true,
    },
    async width() {
      await this.ready
      if (this.viewer) this.viewer.width = this.width
    },
    async height() {
      await this.ready
      if (this.viewer) this.viewer.height = this.height
    },
  },

  beforeUnmount() {
    this.unmounted = true
    this.viewer?.dispose()
  },

  mounted() {
    this.ready = this.init()
  },

  methods: {
    async init() {
      const library = await import('skinview3d')

      if (this.unmounted) return

      this.library = library
      this.viewer = new library.SkinViewer({
        canvas: this.$refs.viewer,
        width: this.width,
        height: this.height,
      })

      this.viewer.controls.enableRotate = true
      this.viewer.controls.enableZoom = false
      this.viewer.controls.enablePan = false

      this.loadSkin()
      this.loadCloak()
    },

    async loadSkin() {
      await this.ready

      if (!this.viewer) return

      this.viewer.loadSkin(
        this.skin && this.$_.get(this.skin, 'file') ? `${this.rc.apiBaseurl}/${this.$_.get(this.skin, 'file')}` : '/default.png',
      )
    },

    async loadCloak() {
      await this.ready

      if (!this.viewer) return

      this.viewer.loadCape(
        this.cloak && this.$_.get(this.cloak, 'file') ? `${this.rc.apiBaseurl}/${this.$_.get(this.cloak, 'file')}` : null,
      )
    },

    async setAnimation(animation) {
      await this.ready

      if (!this.viewer) return

      this.viewer.autoRotate = animation === 'rotate'

      switch (animation) {
        case 'walk':
          this.viewer.animation = new this.library.WalkingAnimation()
          break
        case 'run':
          this.viewer.animation = new this.library.RunningAnimation()
          break
        default:
          this.viewer.animation = null
      }
    },
  },
}
</script>
