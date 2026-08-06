<template>
  <canvas ref="viewer" />
</template>

<script>
import * as skinview3d from 'skinview3d'

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
    width() {
      this.viewer.width = this.width
    },
    height() {
      this.viewer.height = this.height
    },
  },

  beforeUnmount() {
    this.viewer?.dispose()
  },

  mounted() {
    this.viewer = new skinview3d.SkinViewer({
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

  methods: {
    loadSkin() {
      this.viewer.loadSkin(
        this.skin && this.$_.get(this.skin, 'file')
          ? `${this.rc.apiBaseurl}/${this.$_.get(this.skin, 'file')}`
          : '/default.png',
      )
    },

    loadCloak() {
      this.viewer.loadCape(
        this.cloak && this.$_.get(this.cloak, 'file') ? `${this.rc.apiBaseurl}/${this.$_.get(this.cloak, 'file')}` : null,
      )
    },

    setAnimation(animation) {
      this.viewer.autoRotate = animation === 'rotate'

      switch (animation) {
        case 'walk':
          this.viewer.animation = new skinview3d.WalkingAnimation()
          break
        case 'run':
          this.viewer.animation = new skinview3d.RunningAnimation()
          break
        default:
          this.viewer.animation = null
      }
    },
  },
}
</script>
