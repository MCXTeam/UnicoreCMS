<template>
  <div class="email-editor">
    <div class="email-editor__toolbar" role="group" :aria-label="$t('admin.email_editor_mode')">
      <Button type="button" severity="secondary" :label="$t('admin.email_preview')" icon="pi pi-eye" :outlined="mode !== 'preview'" :aria-pressed="mode === 'preview'" @click="mode = 'preview'" />
      <Button type="button" severity="secondary" label="HTML" icon="pi pi-code" :outlined="mode !== 'html'" :aria-pressed="mode === 'html'" @click="mode = 'html'" />
      <Button v-if="simpleAllowed" type="button" severity="secondary" :label="$t('admin.email_simple_editor')" icon="pi pi-pencil" :outlined="mode !== 'simple'" :aria-pressed="mode === 'simple'" @click="mode = 'simple'" />
    </div>
    <p class="email-editor__hint">{{ $t('admin.email_variables') }} <code>{{ variables.join(' ') }}</code></p>
    <template v-if="mode === 'preview'">
      <p class="email-editor__hint">{{ $t('admin.email_preview_hint') }}</p>
      <EmailTemplatePreview :content="modelValue" />
    </template>
    <Textarea
      v-else-if="mode === 'html'"
      class="email-editor__source"
      :modelValue="modelValue || ''"
      :aria-label="$t('admin.email_html_source')"
      spellcheck="false"
      autocapitalize="off"
      autocomplete="off"
      rows="18"
      @update:modelValue="$emit('update:modelValue', $event)"
    />
    <RichEditor v-else :modelValue="modelValue" height="400px" @update:modelValue="$emit('update:modelValue', $event)" />
  </div>
</template>

<script setup lang="ts">
import { EMAIL_VARIABLES, isSimpleEmailTemplate } from '~/utils/email-preview'

const props = defineProps<{ modelValue?: string | null; templateId?: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
const mode = ref('preview')
const simpleAllowed = computed(() => mode.value === 'simple' || isSimpleEmailTemplate(props.modelValue || ''))
const variables = computed(() => ['SITENAME', 'USERNAME', ...(EMAIL_VARIABLES[props.templateId || ''] || [])].map((key) => `{${key}}`))

watch(() => props.templateId, () => { mode.value = 'preview' })
</script>

<style scoped>
.email-editor {
  min-width: 0;
}
.email-editor__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.email-editor__toolbar :deep(button) {
  width: auto;
}
.email-editor__hint {
  margin: 12px 0;
  color: var(--p-text-muted-color);
  font-size: 14px;
  overflow-wrap: anywhere;
}
.email-editor__hint code {
  font-size: inherit;
}
.email-editor__source {
  display: block;
  width: 100%;
  min-height: 400px;
  resize: vertical;
  font-family: Consolas, monospace;
  font-size: 14px;
  line-height: 1.5;
  tab-size: 2;
}
</style>
