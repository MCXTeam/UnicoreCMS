<template>
  <div class="setting-field" :class="{ 'setting-field--switch': field.type === 'boolean', 'setting-field--changed': changed }">
    <div class="setting-field__description">
      <label :for="id">{{ label }} <span v-if="changed" class="setting-field__dot" aria-hidden="true">•</span></label>
      <p v-if="field.hint" :id="`${id}-hint`">{{ $t(field.hint) }}</p>
      <small v-if="field.restartRequired">{{ $t('settings.restart_required') }}</small>
      <small v-if="technical">{{ field.key }}</small>
    </div>
    <div class="setting-field__control">
      <ToggleSwitch
        v-if="field.type === 'boolean'"
        :inputId="id"
        :modelValue="modelValue === 'true' || modelValue === '1'"
        :disabled="disabled"
        :aria-describedby="describedBy"
        @update:modelValue="$emit('update:modelValue', String($event))"
      />
      <Select
        v-else-if="field.type === 'select'"
        :inputId="id"
        :modelValue="modelValue"
        :options="options"
        optionLabel="label"
        optionValue="value"
        :disabled="disabled"
        :invalid="!!error"
        :aria-describedby="describedBy"
        @update:modelValue="$emit('update:modelValue', $event ?? '')"
      />
      <Textarea
        v-else-if="field.input === 'textarea'"
        :id="id"
        :modelValue="modelValue || ''"
        :disabled="disabled"
        :invalid="!!error"
        :aria-describedby="describedBy"
        rows="3"
        autoResize
        @update:modelValue="$emit('update:modelValue', $event ?? '')"
      />
      <div v-else class="setting-field__input">
        <InputText
          :id="id"
          :modelValue="modelValue ?? ''"
          :type="field.type === 'number' ? 'number' : 'text'"
          :inputmode="field.type === 'number' ? 'decimal' : undefined"
          :min="field.min"
          :max="field.max"
          :step="field.integer ? 1 : 'any'"
          :maxlength="field.maxLength"
          :placeholder="field.placeholder"
          :disabled="disabled"
          :invalid="!!error"
          :aria-describedby="describedBy"
          @update:modelValue="$emit('update:modelValue', $event ?? '')"
        />
        <span v-if="field.unit">{{ $t(field.unit) }}</span>
      </div>
      <p v-if="error" :id="`${id}-error`" class="setting-field__error" role="alert">
        {{ $t(error, { min: field.min ?? '', max: field.max ?? '', maxLength: field.maxLength ?? '' }) }}
      </p>
      <div v-if="field.input === 'image'" class="setting-field__image">
        <img
          v-if="modelValue && !imageFailed && !settingIssue(field, modelValue)"
          :src="modelValue"
          :alt="label"
          @error="imageFailed = true"
        />
        <input :id="`${id}-upload`" ref="fileInput" type="file" accept="image/*" hidden @change="upload" />
        <Button
          v-if="!disabled"
          type="button"
          :label="$t('settings.upload_image')"
          icon="pi pi-upload"
          severity="secondary"
          outlined
          :loading="uploading"
          @click="fileInput?.click()"
        />
        <p v-if="imageFailed" role="alert" class="setting-field__error">{{ $t('settings.error.image') }}</p>
        <p v-if="uploadError" role="alert" class="setting-field__error">{{ $t('settings.error.upload') }}</p>
      </div>
      <Button
        v-if="!disabled && field.default !== undefined && modelValue !== String(field.default)"
        type="button"
        :label="$t('settings.use_default')"
        size="small"
        text
        severity="secondary"
        @click="$emit('update:modelValue', String(field.default))"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { settingIssue, type SettingsField } from 'unicore-api'

const props = defineProps<{
  field: SettingsField
  modelValue: string | null
  inputId?: string
  disabled?: boolean
  changed?: boolean
  error?: string
  technical?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string | null]; uploading: [value: boolean] }>()
const { $t, $uploadImage } = useNuxtApp()
const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref(false)
const imageFailed = ref(false)
let uploadRevision = 0
onBeforeUnmount(() => {
  uploadRevision++
  emit('uploading', false)
})
watch(
  () => props.modelValue,
  () => {
    imageFailed.value = false
    uploadRevision++
  },
)
async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || props.disabled || uploading.value) return
  const revision = ++uploadRevision
  uploading.value = true
  emit('uploading', true)
  uploadError.value = false
  try {
    const url = await $uploadImage(file)
    if (revision === uploadRevision && !props.disabled) emit('update:modelValue', url)
  } catch {
    if (revision === uploadRevision) uploadError.value = true
  } finally {
    uploading.value = false
    emit('uploading', false)
    input.value = ''
  }
}
const uid = useId()
const id = computed(() => props.inputId || `${uid}-${props.field.key}`)
const label = computed(() => (props.field.label ? $t(props.field.label) : props.field.key))
const describedBy = computed(
  () => [props.field.hint ? `${id.value}-hint` : '', props.error ? `${id.value}-error` : ''].filter(Boolean).join(' ') || undefined,
)
const options = computed(() => props.field.options?.map((option) => ({ ...option, label: $t(option.label) })))
</script>

<style scoped>
.setting-field {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(200px, 0.8fr);
  gap: 24px;
  padding: 24px 0;
  border-top: 1px solid var(--p-content-border-color);
}
.setting-field:first-child {
  border-top: 0;
}
.setting-field__description label {
  display: block;
  font-weight: 600;
  color: var(--p-text-color);
}
.setting-field__description p {
  margin: 8px 0 0;
  color: var(--p-text-muted-color);
  font-size: 14px;
  line-height: 1.5;
}
.setting-field__description small {
  display: block;
  margin-top: 8px;
  overflow-wrap: anywhere;
}
.setting-field__control {
  min-width: 0;
}
.setting-field__control :deep(.p-inputtext),
.setting-field__control :deep(.p-select),
.setting-field__control :deep(textarea) {
  width: 100%;
}
.setting-field__input {
  display: flex;
  align-items: center;
  gap: 8px;
}
.setting-field__input span {
  white-space: nowrap;
  color: var(--p-text-muted-color);
  font-size: 14px;
}
.setting-field__input :deep(input) {
  min-width: 0;
}
.setting-field--switch .setting-field__control {
  text-align: right;
}
.setting-field--switch .setting-field__control :deep(button) {
  display: block;
  margin-left: auto;
}
.setting-field__dot {
  color: var(--p-primary-color);
}
.setting-field__error {
  margin: 8px 0 0;
  color: var(--p-red-600);
  font-size: 14px;
}
.setting-field__image {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.setting-field__image img {
  width: 56px;
  height: 56px;
  object-fit: contain;
}
@media (max-width: 800px) {
  .setting-field {
    grid-template-columns: minmax(0, 1fr);
    gap: 16px;
  }
  .setting-field--switch {
    grid-template-columns: minmax(0, 1fr) auto;
  }
}
</style>
