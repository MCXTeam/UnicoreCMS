<template>
  <div class="field">
    <label class="flex align-items-center gap-1">
      {{ label }}
      <i v-if="hint" v-tooltip.right="hint" class="pi pi-question-circle text-color-secondary" />
    </label>
    <div class="flex align-items-center gap-2">
      <ColorPicker :modelValue="picker" @update:modelValue="pick" format="hex" appendTo="body" />
      <InputText :modelValue="modelValue" @update:modelValue="change" :placeholder="placeholder" class="flex-1" />
      <Button
        type="button"
        icon="pi pi-times"
        class="p-button-secondary"
        v-tooltip.bottom="$t('admin.role_color_clear')"
        @click="$emit('update:modelValue', null)"
      />
    </div>
  </div>
</template>

<script>
const EMPTY_COLOR = '#9e9e9e'

export default {
  name: 'ColorField',
  props: {
    modelValue: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      default: '',
    },
    hint: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  computed: {
    picker() {
      return (this.modelValue || EMPTY_COLOR).replace('#', '')
    },
  },
  methods: {
    pick(value) {
      this.$emit('update:modelValue', value ? `#${String(value).replace('#', '')}` : null)
    },
    change(value) {
      this.$emit('update:modelValue', value || null)
    },
  },
}
</script>
