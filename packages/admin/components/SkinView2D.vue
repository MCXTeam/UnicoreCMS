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
    skin: Object,
  },

  watch: {
    skin: {
      handler: function () {
        this.render()
      },
      deep: true,
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
        skinUrl:
          this.skin && this.$_.get(this.skin, 'file')
            ? `${this.$config.apiUrl}/${this.$_.get(this.skin, 'file')}`
            : `${this.$config.url}/default.png`,
        width: this.width,
        height: this.height,
      })
    },
  },
}
</script>
