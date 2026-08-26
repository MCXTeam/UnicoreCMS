<template>
  <div v-if="field.type === 'heading'" class="ff-heading">
    <h3>{{ field.label }}</h3>
    <p v-if="field.hint">{{ field.hint }}</p>
  </div>

  <p v-else-if="field.type === 'paragraph'" class="ff-paragraph">{{ field.label }}</p>

  <div v-else-if="field.type === 'divider'" class="ff-divider"></div>

  <div v-else class="ff-field">
    <label class="ff-field__label">
      {{ field.label }}<span v-if="field.required" class="p-error"> *</span>
      <i v-if="field.hint" v-tooltip.right="field.hint" class="bx bx-help-circle ff-field__hint"></i>
    </label>

    <InputText
      v-if="['text', 'email', 'url'].includes(field.type)"
      v-model="value"
      :type="field.type === 'text' ? 'text' : field.type"
      :placeholder="field.placeholder || ''"
      :maxlength="field.settings?.max_length"
      :class="invalid"
    />

    <template v-else-if="field.type === 'textarea'">
      <Textarea v-model="value" :rows="field.settings?.rows || DEFAULT_TEXTAREA_ROWS" :placeholder="field.placeholder || ''" :maxlength="field.settings?.max_length" :class="invalid" autoResize />
      <small v-if="field.settings?.max_length" class="ff-field__counter">{{ String(value || '').length }} / {{ field.settings.max_length }}</small>
    </template>

    <InputNumber
      v-else-if="field.type === 'number'"
      v-model="value"
      :min="field.settings?.min"
      :max="field.settings?.max"
      :step="field.settings?.step || 1"
      :placeholder="field.placeholder || ''"
      :class="invalid"
      showButtons
    />

    <Select
      v-else-if="field.type === 'select'"
      v-model="value"
      :options="field.options || []"
      optionLabel="label"
      optionValue="value"
      :placeholder="field.placeholder || $t('mod.forms.choose')"
      :class="invalid"
      showClear
    />

    <Select
      v-else-if="field.type === 'server'"
      v-model="value"
      :options="servers"
      optionLabel="name"
      optionValue="id"
      :placeholder="field.placeholder || $t('mod.forms.choose_server')"
      :class="invalid"
      showClear
    />

    <MultiSelect
      v-else-if="field.type === 'multiselect'"
      v-model="value"
      :options="field.options || []"
      optionLabel="label"
      optionValue="value"
      :placeholder="field.placeholder || $t('mod.forms.choose')"
      :class="invalid"
      display="chip"
    />

    <div v-else-if="field.type === 'radio'" class="ff-field__list">
      <div v-for="option in field.options || []" :key="option.value" class="ff-field__option">
        <RadioButton v-model="value" :inputId="`${field.key}-${option.value}`" :value="option.value" />
        <label :for="`${field.key}-${option.value}`">{{ option.label }}</label>
      </div>
    </div>

    <div v-else-if="field.type === 'checkboxes'" class="ff-field__list">
      <div v-for="option in field.options || []" :key="option.value" class="ff-field__option">
        <Checkbox v-model="value" :inputId="`${field.key}-${option.value}`" :value="option.value" />
        <label :for="`${field.key}-${option.value}`">{{ option.label }}</label>
      </div>
    </div>

    <div v-else-if="field.type === 'checkbox'" class="ff-field__option">
      <Checkbox v-model="value" :inputId="field.key" binary />
      <label :for="field.key">{{ field.placeholder || field.label }}</label>
    </div>

    <div v-else-if="field.type === 'switch'" class="ff-field__option">
      <ToggleSwitch v-model="value" :inputId="field.key" />
      <label :for="field.key">{{ value ? $t('mod.forms.yes') : $t('mod.forms.no') }}</label>
    </div>

    <DatePicker v-else-if="field.type === 'date'" v-model="value" dateFormat="dd.mm.yy" :class="invalid" showIcon />

    <div v-else-if="field.type === 'slider'" class="ff-field__slider">
      <Slider v-model="value" :min="field.settings?.min || 0" :max="field.settings?.max || 10" :step="field.settings?.step || 1" />
      <span class="ff-field__value">{{ value ?? field.settings?.min ?? 0 }}</span>
    </div>

    <Rating v-else-if="field.type === 'rating'" v-model="value" :stars="field.settings?.stars || DEFAULT_RATING_STARS" />

    <div v-else-if="field.type === 'file'" class="ff-field__file">
      <div v-if="value" class="ff-field__attached">
        <i class="bx bx-paperclip"></i>
        <a :href="String(value)" target="_blank" rel="noopener">{{ $t('mod.forms.attached') }}</a>
        <Button icon="bx bx-x" text rounded severity="danger" @click="value = null" />
      </div>
      <FileUpload
        v-else
        mode="basic"
        :accept="field.settings?.accept || undefined"
        :maxFileSize="(field.settings?.max_size || DEFAULT_MAX_SIZE_MB) * MEGABYTE"
        :chooseLabel="$t('mod.forms.attach')"
        :disabled="uploading"
        customUpload
        auto
        @uploader="upload"
      />
      <small class="ff-field__counter">{{ $t('mod.forms.attach_hint', { size: field.settings?.max_size || DEFAULT_MAX_SIZE_MB }) }}</small>
    </div>

    <small v-if="error" class="p-error">{{ $t(error) }}</small>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_MAX_SIZE_MB, DEFAULT_RATING_STARS, DEFAULT_TEXTAREA_ROWS } from '../../shared/constants'
import type { FormFieldShape } from '../../shared/constants'

const MEGABYTE = 1024 * 1024

const props = defineProps<{
  field: FormFieldShape
  modelValue: unknown
  servers: { id: string; name: string }[]
  slug: string
  error?: string | null
}>()

const emit = defineEmits<{ (event: 'update:modelValue', value: unknown): void }>()

const { $api, $t } = useNuxtApp()
const uploading = ref(false)

const value = computed<any>({
  get: () => props.modelValue,
  set: (next) => emit('update:modelValue', next),
})

const invalid = computed(() => (props.error ? 'p-invalid' : ''))

async function upload(event: { files: File | File[] }) {
  const file = Array.isArray(event.files) ? event.files[0] : event.files

  if (!file) return

  const body = new FormData()

  body.append('file', file)
  uploading.value = true

  const url = await $api
    .post(`/mod/forms/${props.slug}/upload`, body)
    .then((res: any) => res.data.url)
    .catch(() => null)

  uploading.value = false

  if (url) value.value = url
}
</script>

<style scoped>
.ff-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.ff-field__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
}
.ff-field__hint {
  color: rgba(var(--vs-text), 0.5);
  cursor: help;
}
.ff-field__counter {
  align-self: flex-end;
  color: rgba(var(--vs-text), 0.5);
}
.ff-field__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.ff-field__option {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ff-field__option label {
  cursor: pointer;
}
.ff-field__slider {
  display: flex;
  align-items: center;
  gap: 16px;
}
.ff-field__slider :deep(.p-slider) {
  flex: 1;
}
.ff-field__value {
  min-width: 2.5rem;
  font-weight: 600;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.ff-field__file {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
}
.ff-field__attached {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ff-heading {
  margin-top: 8px;
}
.ff-heading h3 {
  margin: 0;
  font-size: 17px;
}
.ff-heading p {
  margin: 4px 0 0;
  color: rgba(var(--vs-text), 0.6);
  font-size: 13px;
}
.ff-paragraph {
  margin: 0;
  color: rgba(var(--vs-text), 0.7);
  font-size: 14px;
  line-height: 1.5;
}
.ff-divider {
  height: 1px;
  background: rgba(var(--vs-text), 0.1);
}
</style>
