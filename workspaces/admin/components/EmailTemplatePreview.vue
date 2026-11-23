<template>
  <iframe class="email-preview" :title="$t('admin.email_preview')" :srcdoc="document" sandbox="" referrerpolicy="no-referrer" />
</template>

<script setup lang="ts">
import { emailPreview } from '~/utils/email-preview'
import { useConfigStore } from '~/stores/config'

const props = defineProps<{ content?: string | null }>()
const config = useRuntimeConfig()
const settings = useConfigStore()
const document = computed(() => emailPreview(props.content || '', String(settings.config.public_project_name || config.public.sitename)))
</script>

<style scoped>
.email-preview {
  display: block;
  width: 100%;
  height: 480px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 12px;
  background: #f4f7f8;
}
</style>
