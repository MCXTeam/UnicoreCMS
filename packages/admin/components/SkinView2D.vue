<template>
  <div ref="skinHead" :style="`max-width: ${width}px; max-height: ${height}px`" />
</template>
<script>
import { SkinViewer2D } from '../../admin/libs/skinview2d'

export default {
  props: {
    width: {
      type: Number,
      default: 64,
    },
    height: {
      type: Number,
      default: 64,
    },
    skinUrl: String,
  },

  watch: {
    skinUrl() {
      this.render()
    },
    width() {
      this.render()
    },
    height() {
      this.render()
    },
  },

  mounted() {
    this.render()
  },

  methods: {
    render() {
      new SkinViewer2D({
        domElement: this.$refs.skinHead,
        skinUrl: this.skinUrl || `${this.$config.url}/default.png`,
        width: this.width || 64,
        height: this.height || 64,
      })
    },
  },
}
</script>
