<template>
  <SectionedDialog
    :visible="visible"
    v-model="section"
    :sections="sections"
    :header="$t(draft.id ? 'mod.forms.field_edit' : 'mod.forms.field_add')"
    width="620px"
    class="p-fluid"
    @update:visible="$emit('update:visible', $event)"
  >
    <template #main>
      <div class="field">
        <label>{{ $t('mod.forms.field_type') }}<span class="p-error"> *</span></label>
        <Select v-model="draft.type" :options="typeOptions" optionLabel="label" optionValue="type" @change="onType">
          <template #value="{ value }">
            <span v-if="value" class="flex align-items-center gap-2"><i :class="typeOf(value).icon" />{{ $t(typeOf(value).label) }}</span>
          </template>
          <template #option="{ option }">
            <span class="flex align-items-center gap-2"><i :class="option.icon" />{{ option.label }}</span>
          </template>
        </Select>
      </div>

      <div class="field">
        <label>{{ $t(info.input ? 'mod.forms.field_label' : 'mod.forms.field_text') }}<span class="p-error"> *</span></label>
        <Textarea v-if="draft.type === 'paragraph'" v-model="draft.label" rows="3" autoResize />
        <InputText v-else v-model="draft.label" @update:modelValue="syncKey" />
      </div>

      <div v-if="info.input" class="field">
        <label class="flex align-items-center gap-1">
          {{ $t('mod.forms.field_key') }}
          <i v-tooltip.right="$t('mod.forms.field_key_hint')" class="pi pi-question-circle text-color-secondary" />
        </label>
        <InputText v-model="draft.key" @update:modelValue="keyTouched = true" />
        <small v-if="keyError" class="p-error">{{ $t(keyError) }}</small>
      </div>

      <div class="field">
        <label class="flex align-items-center gap-1">
          {{ $t('mod.forms.field_hint') }}
          <i v-tooltip.right="$t('mod.forms.field_hint_hint')" class="pi pi-question-circle text-color-secondary" />
        </label>
        <InputText v-model="draft.hint" />
      </div>

      <div v-if="info.input && !['checkbox', 'switch', 'rating', 'slider', 'file', 'date'].includes(draft.type)" class="field">
        <label>{{ $t('mod.forms.field_placeholder') }}</label>
        <InputText v-model="draft.placeholder" />
      </div>

      <div v-if="info.input" class="field-checkbox">
        <Checkbox v-model="draft.required" inputId="ff-required" binary />
        <label for="ff-required">{{ $t('mod.forms.field_required') }}</label>
      </div>

      <div class="field-checkbox">
        <Checkbox v-model="draft.half" inputId="ff-half" binary />
        <label for="ff-half">{{ $t('mod.forms.field_half') }}</label>
      </div>
    </template>

    <template #options>
      <div v-for="(option, index) in draft.options" :key="index" class="ff-option">
        <InputText v-model="option.label" :placeholder="$t('mod.forms.option_label')" @update:modelValue="syncOption(option)" />
        <InputText v-model="option.value" :placeholder="$t('mod.forms.option_value')" />
        <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="draft.options.splice(index, 1)" />
      </div>
      <small v-if="!draft.options.length" class="p-error">{{ $t('mod.forms.options_empty') }}</small>
      <Button :label="$t('mod.forms.option_add')" icon="pi pi-plus" class="p-button-text mt-2" @click="addOption()" />
    </template>

    <template #rules>
      <div v-if="info.settings.length" class="formgrid grid">
        <div v-for="key in info.settings" :key="key" class="field col-6">
          <label class="flex align-items-center gap-1">
            {{ $t(`mod.forms.setting_${key}`) }}
            <i v-tooltip.right="$t(`mod.forms.setting_${key}_hint`)" class="pi pi-question-circle text-color-secondary" />
          </label>
          <InputText v-if="['pattern', 'accept'].includes(key)" v-model="draft.settings[key]" />
          <InputNumber v-else v-model="draft.settings[key]" :min="0" showButtons />
        </div>
      </div>

      <Divider />

      <h6 class="mt-0">{{ $t('mod.forms.condition') }}</h6>
      <p class="text-color-secondary mt-0">{{ $t('mod.forms.condition_hint') }}</p>

      <div class="formgrid grid">
        <div class="field col-12 md:col-4">
          <label>{{ $t('mod.forms.condition_field') }}</label>
          <Select
            v-model="draft.visible_if.field"
            :options="sources"
            optionLabel="label"
            optionValue="key"
            :placeholder="$t('mod.forms.condition_always')"
            showClear
          />
        </div>
        <div class="field col-12 md:col-4">
          <label>{{ $t('mod.forms.condition_op') }}</label>
          <Select
            v-model="draft.visible_if.op"
            :options="operatorOptions"
            optionLabel="label"
            optionValue="value"
            :disabled="!draft.visible_if.field"
          />
        </div>
        <div class="field col-12 md:col-4">
          <label>{{ $t('mod.forms.condition_value') }}</label>
          <InputText v-model="draft.visible_if.value" :disabled="!draft.visible_if.field || !needsValue" />
        </div>
      </div>
    </template>

    <template #translations>
      <LocaleEditorBar
        v-model="translations.locale"
        :locales="translations.locales"
        :status="translations.status"
        :isDefault="translations.isDefault"
        @copy="translations.copyFromDefault()"
      />
      <ContentTranslationFields :translations="translations" />
    </template>

    <template #footer>
      <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
      <Button :label="$t('common.save')" icon="pi pi-check" class="p-button-text" :disabled="!valid" @click="apply()" />
    </template>
  </SectionedDialog>
</template>

<script>
import { CONDITION_OPERATORS, FIELD_KEY_PATTERN, FIELD_TYPES, fieldType, toKey } from '../../shared/constants'

const FIELD_TRANSLATABLE = [
  { path: 'label', label: 'mod.forms.field_label', type: 'text' },
  { path: 'hint', label: 'mod.forms.field_hint', type: 'text' },
  { path: 'placeholder', label: 'mod.forms.field_placeholder', type: 'text' },
  { path: 'options.*.label', label: 'mod.forms.option_label', type: 'text' },
]

const blank = () => ({
  id: null,
  key: '',
  type: 'text',
  label: '',
  hint: '',
  placeholder: '',
  required: false,
  half: false,
  options: [],
  settings: {},
  visible_if: { field: null, op: 'filled', value: '' },
})

export default {
  props: {
    visible: { type: Boolean, default: false },
    field: { type: Object, default: null },
    fields: { type: Array, default: () => [] },
  },
  emits: ['update:visible', 'save'],
  setup() {
    return { translations: useContentTranslations('mod.forms.field', FIELD_TRANSLATABLE) }
  },
  data() {
    return {
      draft: blank(),
      section: 'main',
      keyTouched: false,
    }
  },
  computed: {
    info() {
      return fieldType(this.draft.type)
    },
    typeOptions() {
      return FIELD_TYPES.map((item) => ({ ...item, label: this.$t(item.label) }))
    },
    operatorOptions() {
      return CONDITION_OPERATORS.map((item) => ({ ...item, label: this.$t(item.label) }))
    },
    sections() {
      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle' },
        { key: 'options', label: 'mod.forms.tab_options', icon: 'pi pi-list', hidden: !this.info.options },
        { key: 'rules', label: 'mod.forms.tab_rules', icon: 'pi pi-filter', hidden: !this.info.input },
        { key: 'translations', label: 'mod.forms.tab_translations', icon: 'pi pi-globe', hidden: !this.draft.id },
      ]
    },
    sources() {
      return this.fields
        .filter((item) => item.key !== this.draft.key && fieldType(item.type).input)
        .map((item) => ({ key: item.key, label: item.label }))
    },
    needsValue() {
      return CONDITION_OPERATORS.find((item) => item.value === this.draft.visible_if.op)?.value_needed !== false
    },
    keyError() {
      if (!this.info.input || !this.draft.key) return null
      if (!FIELD_KEY_PATTERN.test(this.draft.key)) return 'mod.forms.error_key'

      const twin = this.fields.find((item) => item.key === this.draft.key && item !== this.field)

      return twin ? 'mod.forms.error_key_taken' : null
    },
    valid() {
      if (!this.draft.label || this.keyError) return false
      if (this.info.input && !this.draft.key) return false

      return !this.info.options || this.draft.options.length > 0
    },
  },
  watch: {
    visible(open) {
      if (!open) return

      this.draft = { ...blank(), ...(this.field || {}) }
      this.draft.options = (this.field?.options || []).map((option) => ({ ...option }))
      this.draft.settings = { ...(this.field?.settings || {}) }
      this.draft.visible_if = { field: null, op: 'filled', value: '', ...(this.field?.visible_if || {}) }
      this.keyTouched = Boolean(this.field?.key)
      this.section = 'main'
      this.translations.attach(this.draft)
      this.translations.load(this.draft.id || null)
    },
  },
  methods: {
    typeOf(type) {
      return fieldType(type)
    },
    onType() {
      if (!this.info.options) this.draft.options = []
      else if (!this.draft.options.length) this.addOption()

      if (!this.info.input) this.draft.required = false
    },
    syncKey(label) {
      if (!this.keyTouched) this.draft.key = toKey(label)
    },
    syncOption(option) {
      if (!option.value) option.value = toKey(option.label)
    },
    addOption() {
      this.draft.options.push({ value: '', label: '' })
    },
    async apply() {
      if (this.draft.id) await this.translations.save(this.draft.id)

      this.$emit('save', {
        ...this.draft,
        hint: this.draft.hint || null,
        placeholder: this.draft.placeholder || null,
        options: this.info.options ? this.draft.options : null,
        settings: Object.keys(this.draft.settings).length ? this.draft.settings : null,
        visible_if: this.draft.visible_if.field ? this.draft.visible_if : null,
      })
      this.$emit('update:visible', false)
    },
  },
}
</script>

<style scoped>
.ff-option {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
</style>
