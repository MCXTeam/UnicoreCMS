<template>
  <div v-if="locales.length > 1" class="locale-bar">
    <div class="locale-bar__row">
      <SelectButton
        :modelValue="modelValue"
        @update:modelValue="$emit('update:modelValue', $event || modelValue)"
        :options="locales"
        optionLabel="name"
        optionValue="code"
        :allowEmpty="false"
        class="locale-bar__tabs"
      >
        <template #option="{ option }">
          <span class="locale-bar__dot" :class="`locale-bar__dot--${state(option.code)}`" />
          {{ option.name }}
        </template>
      </SelectButton>
      <Button v-if="!isDefault" text size="small" icon="pi pi-clone" :label="$t('admin.copy_from_default')" @click="$emit('copy')" />
    </div>
    <small v-if="!isDefault" class="locale-bar__hint">
      <i class="pi pi-info-circle" />
      {{ $t('admin.translation_mode_hint') }}
    </small>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: { type: String, default: '' },
    locales: { type: Array, default: () => [] },
    status: { type: Object, default: () => ({}) },
    isDefault: { type: Boolean, default: true },
  },
  emits: ['update:modelValue', 'copy'],
  methods: {
    state(code) {
      const value = this.status[code] ?? 0

      if (value >= 1) return 'full'
      if (value > 0) return 'partial'

      return 'empty'
    },
  },
}
</script>

<style scoped>
.locale-bar {
  margin-bottom: 1.25rem;
}
.locale-bar__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.locale-bar__tabs :deep(.p-togglebutton-content) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.locale-bar__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--p-surface-400);
}
.locale-bar__dot--full {
  background: var(--p-green-500);
}
.locale-bar__dot--partial {
  background: var(--p-amber-500);
}
.locale-bar__hint {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.5rem;
  color: var(--p-text-muted-color);
}
</style>
