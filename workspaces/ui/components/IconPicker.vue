<template>
  <div class="icon-picker">
    <button
      type="button"
      class="icon-picker__field"
      :class="{ 'icon-picker__field--compact': compact }"
      :disabled="disabled"
      :title="modelValue || $t('ui.icon_none')"
      @click="open"
    >
      <i class="icon-picker__preview" :class="modelValue || fallback"></i>
      <span v-if="!compact" class="icon-picker__value">{{ modelValue || $t('ui.icon_none') }}</span>
      <i class="bx bx-chevron-down icon-picker__caret"></i>
    </button>
    <button v-if="modelValue && !disabled" type="button" class="icon-picker__clear" @click="pick('')">
      <i class="bx bx-x"></i>
    </button>

    <Popover ref="panel" class="icon-picker__panel">
      <InputText
        ref="search"
        v-model="query"
        class="icon-picker__search"
        :placeholder="$t('ui.icon_search')"
        @keydown.enter.prevent="pickFirst()"
      />

      <div v-if="shown.length" class="icon-picker__grid">
        <button
          v-for="name in shown"
          :key="name"
          type="button"
          class="icon-picker__item"
          :class="{ 'icon-picker__item--active': modelValue === `bx ${name}` }"
          :title="name"
          @click="pick(`bx ${name}`)"
        >
          <i :class="`bx ${name}`"></i>
        </button>
      </div>
      <p v-else class="icon-picker__empty">{{ $t('ui.icon_empty') }}</p>

      <small v-if="truncated" class="icon-picker__hint">{{ $t('ui.icon_more') }}</small>
    </Popover>
  </div>
</template>

<script setup lang="ts">
import { BOXICONS } from '../icons'

const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    fallback?: string
    disabled?: boolean
    compact?: boolean
    limit?: number
  }>(),
  { fallback: 'bx bx-shape-square', limit: 120 },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const panel = ref<any>(null)
const search = ref<any>(null)
const query = ref('')

const matched = computed(() => {
  const term = query.value.trim().toLowerCase()

  if (!term) return BOXICONS

  return BOXICONS.filter((name) => name.includes(term))
})

const shown = computed(() => matched.value.slice(0, props.limit))

const truncated = computed(() => matched.value.length > shown.value.length)

function open(event: MouseEvent) {
  panel.value?.toggle(event)

  nextTick(() => search.value?.$el?.focus())
}

function pick(value: string) {
  emit('update:modelValue', value)
  panel.value?.hide()
}

function pickFirst() {
  if (shown.value.length) pick(`bx ${shown.value[0]}`)
}
</script>

<style scoped>
.icon-picker {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.icon-picker__field {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 auto;
  min-width: 0;
  padding: var(--p-inputtext-padding-y) var(--p-inputtext-padding-x);
  border: 1px solid var(--p-inputtext-border-color);
  border-radius: var(--p-inputtext-border-radius);
  background: var(--p-inputtext-background);
  color: var(--p-inputtext-color);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.icon-picker__field:hover:not(:disabled) {
  border-color: var(--p-inputtext-hover-border-color);
}
.icon-picker__field:disabled {
  cursor: default;
  opacity: 0.6;
}
.icon-picker__field--compact {
  justify-content: center;
  gap: 6px;
  padding-inline: 0.5rem;
}
.icon-picker__preview {
  flex: 0 0 auto;
  font-size: 1.25em;
  line-height: 1;
}
.icon-picker__value {
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.icon-picker__caret {
  flex: 0 0 auto;
  line-height: 1;
  opacity: 0.6;
}
.icon-picker__clear {
  flex: 0 0 auto;
  padding: 0.35rem;
  border: none;
  border-radius: 8px;
  background: none;
  color: inherit;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.6;
}
.icon-picker__clear:hover {
  opacity: 1;
}
.icon-picker__search {
  width: 100%;
}
.icon-picker__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, 40px);
  gap: 4px;
  max-height: 280px;
  margin-top: 10px;
  overflow-y: auto;
}
.icon-picker__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
}
.icon-picker__item:hover {
  background: var(--p-content-hover-background);
}
.icon-picker__item--active {
  border-color: var(--p-primary-color);
  color: var(--p-primary-color);
}
.icon-picker__empty {
  margin: 12px 0 0;
  text-align: center;
  opacity: 0.6;
}
.icon-picker__hint {
  display: block;
  margin-top: 8px;
  opacity: 0.6;
}
</style>

<style>
.icon-picker__panel {
  width: min(420px, calc(100vw - 24px));
}
</style>
