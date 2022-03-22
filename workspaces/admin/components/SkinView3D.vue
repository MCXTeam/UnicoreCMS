<template>
  <canvas ref="viewer" />
</template>

<script>
import * as skinview3d from 'skinview3d'

export default {
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
      control: null,
      animation: null,
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

  beforeDestroy() {
    this.viewer.dispose()
  },

  mounted() {
    this.viewer = new skinview3d.SkinViewer({
      canvas: this.$refs.viewer,
      width: this.width,
      height: this.height,
    })

    this.control = skinview3d.createOrbitControls(this.viewer)
    this.control.enableRotate = true
    this.control.enableZoom = false
    this.control.enablePan = false

    this.loadSkin()
    this.loadCloak()
  },

  methods: {
    loadSkin() {
      this.viewer.loadSkin(
        this.skin && this.$_.get(this.skin, 'file')
          ? `${this.$config.apiUrl}/${this.$_.get(this.skin, 'file')}`
          : `${this.$config.url}/default.png`
      )
    },

    loadCloak() {
      this.viewer.loadCape(
        this.cloak && this.$_.get(this.cloak, 'file') ? `${this.$config.apiUrl}/${this.$_.get(this.cloak, 'file')}` : null
      )
    },

    setAnimation(animation) {
      this.animation?.resetAndRemove()

      switch (animation) {
        case 'walk':
          this.animation = this.viewer.animations.add(skinview3d.WalkingAnimation)
          break
        case 'run':
          this.animation = this.viewer.animations.add(skinview3d.RunningAnimation)
          break
        case 'rotate':
          this.animation = this.viewer.animations.add(skinview3d.RotatingAnimation)
          break
        default:
          this.animation = this.viewer.animations.add(skinview3d.FlyingAnimation)
          this.animation?.resetAndRemove()
      }
    },
  },
}
</script>
