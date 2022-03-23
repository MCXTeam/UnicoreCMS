<template>
  <div class="layout-menu-container">
    <AppSubmenu :items="model" class="layout-menu" :root="true" @menuitem-click="onMenuItemClick" @keydown="onKeyDown" />
    <a target="_blank" href="https://unicorecms.ru/docs" class="block mt-3 docs-image">
      <img alt="unicoredocs" src="/docs.jpg" class="w-full" />
    </a>
  </div>
</template>

<script>
export default {
  props: {
    model: Array,
  },
  methods: {
    onMenuItemClick(event) {
      this.$emit('menuitem-click', event)
    },
    onKeyDown(event) {
      const nodeElement = event.target
      if (event.code === 'Enter' || event.code === 'Space') {
        nodeElement.click()
        event.preventDefault()
      }
    },
  },
}
</script>
