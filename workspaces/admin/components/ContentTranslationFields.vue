<template>
  <div>
    <div v-for="field in translations.visible" :key="field.path" class="field translation-field">
      <label>
        {{ $t(field.label) }}
        <span v-if="field.row" class="translation-field__row">{{ field.row }}</span>
      </label>
      <div class="translation-field__original" :class="field.type === 'html' && 'translation-field__original--html'">
        <span v-if="!translations.original(field.path)" class="translation-field__empty">{{ $t('admin.original_empty') }}</span>
        <div v-else-if="field.type === 'html'" v-html="translations.original(field.path)" />
        <span v-else>{{ translations.original(field.path) }}</span>
      </div>
      <Editor
        v-if="field.type === 'html'"
        :modelValue="translations.fields[field.path]"
        @update:modelValue="translations.fields[field.path] = $event"
        editorStyle="height: 260px"
      />
      <Textarea
        v-else-if="field.type === 'textarea'"
        :modelValue="translations.fields[field.path]"
        @update:modelValue="translations.fields[field.path] = $event"
        :autoResize="true"
        rows="2"
      />
      <InputText v-else :modelValue="translations.fields[field.path]" @update:modelValue="translations.fields[field.path] = $event" />
    </div>
    <div v-if="!translations.visible.length" class="translation-field__empty">{{ $t('admin.nothing_to_translate') }}</div>
  </div>
</template>

<script>
export default {
  props: {
    translations: { type: Object, required: true },
  },
}
</script>

<style scoped>
.translation-field__row {
  margin-left: 0.35rem;
  padding: 0 0.4rem;
  border-radius: 0.75rem;
  background: var(--p-surface-200);
  color: var(--p-text-muted-color);
  font-size: 0.75rem;
}
.translation-field__original {
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-left: 2px solid var(--p-surface-300);
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-word;
}
.translation-field__original--html {
  max-height: 12rem;
  overflow-y: auto;
  white-space: normal;
}
.translation-field__empty {
  color: var(--p-text-muted-color);
  font-style: italic;
}
</style>
