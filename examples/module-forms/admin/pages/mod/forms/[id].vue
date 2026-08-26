<template>
  <div v-if="form" class="grid">
    <div class="col-12">
      <div class="card">
        <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2 mb-4">
          <div>
            <h5 class="m-0">{{ form.title }}</h5>
            <small class="text-color-secondary">/mod/forms/{{ form.slug }}</small>
          </div>
          <div class="flex gap-2">
            <Button :label="$t('mod.forms.open_site')" icon="pi pi-external-link" class="p-button-text" @click="openSite()" />
            <Button :label="$t('common.save')" icon="pi pi-check" :disabled="!canWrite || saving" @click="save()" />
          </div>
        </div>

        <Tabs value="fields">
          <TabList>
            <Tab value="fields">{{ $t('mod.forms.tab_fields') }}</Tab>
            <Tab value="main">{{ $t('admin.tab_main') }}</Tab>
            <Tab value="access">{{ $t('mod.forms.tab_access') }}</Tab>
            <Tab value="notify">{{ $t('mod.forms.tab_notify') }}</Tab>
            <Tab value="translations">{{ $t('mod.forms.tab_translations') }}</Tab>
          </TabList>

          <TabPanels>
            <TabPanel value="fields">
              <DataTable :value="form.fields" dataKey="uid" rowHover responsiveLayout="scroll" @rowReorder="reorder">
                <template #header>
                  <div class="flex justify-content-between align-items-center">
                    <small class="text-color-secondary">{{ $t('mod.forms.fields_hint') }}</small>
                    <Button :label="$t('mod.forms.field_add')" icon="pi pi-plus" class="p-button-text" @click="addField()" />
                  </div>
                </template>
                <template #empty>
                  <div class="py-4 text-center">
                    <p class="m-0">{{ $t('mod.forms.fields_empty') }}</p>
                    <small class="text-color-secondary">{{ $t('mod.forms.fields_empty_hint') }}</small>
                  </div>
                </template>

                <Column rowReorder :style="{ width: '3rem' }" />

                <Column :header="$t('mod.forms.field_type')" :style="{ width: '13rem' }">
                  <template #body="{ data }">
                    <span class="flex align-items-center gap-2">
                      <i :class="typeOf(data.type).icon" class="text-color-secondary" />
                      {{ $t(typeOf(data.type).label) }}
                    </span>
                  </template>
                </Column>

                <Column :header="$t('mod.forms.field_label')">
                  <template #body="{ data }">
                    <div class="font-medium">{{ data.label }}</div>
                    <small v-if="typeOf(data.type).input" class="text-color-secondary">{{ data.key }}</small>
                  </template>
                </Column>

                <Column :header="$t('mod.forms.field_marks')" :style="{ width: '14rem' }">
                  <template #body="{ data }">
                    <Tag v-if="data.required" severity="danger" class="mr-1" :value="$t('mod.forms.mark_required')" />
                    <Tag v-if="data.half" severity="secondary" class="mr-1" :value="$t('mod.forms.mark_half')" />
                    <Tag v-if="data.visible_if" severity="info" :value="$t('mod.forms.mark_condition')" />
                  </template>
                </Column>

                <Column :style="{ width: '8rem' }" :bodyStyle="{ 'text-align': 'right' }">
                  <template #body="{ data, index }">
                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-1" @click="editField(data)" />
                    <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" :disabled="!canWrite" @click="dropField(index)" />
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <TabPanel value="main">
              <div class="p-fluid formgrid grid">
                <div class="field col-12 md:col-6">
                  <label>{{ $t('admin.name') }}<span class="p-error"> *</span></label>
                  <InputText v-model="form.title" />
                </div>
                <div class="field col-12 md:col-6">
                  <label class="flex align-items-center gap-1">
                    {{ $t('mod.forms.slug') }}
                    <i v-tooltip.right="$t('mod.forms.slug_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                  <InputGroup>
                    <InputGroupAddon>/mod/forms/</InputGroupAddon>
                    <InputText v-model="form.slug" />
                  </InputGroup>
                </div>
                <div class="field col-12">
                  <label>{{ $t('admin.description') }}</label>
                  <Textarea v-model="form.description" rows="3" autoResize />
                </div>
                <div class="field col-12 md:col-6">
                  <label class="flex align-items-center gap-1">
                    {{ $t('mod.forms.icon') }}
                    <i v-tooltip.right="$t('mod.forms.icon_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                  <InputText v-model="form.icon" placeholder="bx bx-edit-alt" />
                </div>
                <div class="field col-12 md:col-6">
                  <label>{{ $t('mod.forms.submit_label') }}</label>
                  <InputText v-model="form.submit_label" :placeholder="$t('mod.forms.submit')" />
                </div>
                <div class="field col-12">
                  <label class="flex align-items-center gap-1">
                    {{ $t('mod.forms.success_text') }}
                    <i v-tooltip.right="$t('mod.forms.success_text_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                  <Textarea v-model="form.success_text" rows="2" autoResize />
                </div>

                <div class="field-checkbox col-12 md:col-4">
                  <Checkbox v-model="form.enabled" inputId="ff-enabled" binary />
                  <label for="ff-enabled">{{ $t('mod.forms.enabled') }}</label>
                </div>
                <div class="field-checkbox col-12 md:col-4">
                  <Checkbox v-model="form.in_nav" inputId="ff-nav" binary />
                  <label for="ff-nav" class="flex align-items-center gap-1">
                    {{ $t('mod.forms.in_nav') }}
                    <i v-tooltip.right="$t('mod.forms.in_nav_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                </div>
                <div class="field col-12 md:col-4">
                  <label>{{ $t('mod.forms.nav_order') }}</label>
                  <InputNumber v-model="form.nav_order" :min="0" :max="999" showButtons />
                </div>
              </div>
            </TabPanel>

            <TabPanel value="access">
              <div class="p-fluid formgrid grid">
                <div class="field-checkbox col-12">
                  <Checkbox v-model="form.auth_only" inputId="ff-auth" binary />
                  <label for="ff-auth" class="flex align-items-center gap-1">
                    {{ $t('mod.forms.auth_only') }}
                    <i v-tooltip.right="$t('mod.forms.auth_only_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                </div>

                <div class="field col-12 md:col-6">
                  <label class="flex align-items-center gap-1">
                    {{ $t('mod.forms.permission') }}
                    <i v-tooltip.right="$t('mod.forms.permission_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                  <AutoComplete
                    v-model="form.permission"
                    :suggestions="suggestions"
                    :completeOnFocus="true"
                    appendTo="body"
                    @complete="searchPermission($event)"
                  />
                </div>

                <div class="field col-12 md:col-6">
                  <label class="flex align-items-center gap-1">
                    {{ $t('mod.forms.max_total') }}
                    <i v-tooltip.right="$t('mod.forms.max_total_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                  <InputNumber v-model="form.max_total" :min="0" showButtons />
                </div>

                <div class="field-checkbox col-12">
                  <Checkbox v-model="form.once" inputId="ff-once" binary />
                  <label for="ff-once" class="flex align-items-center gap-1">
                    {{ $t('mod.forms.once') }}
                    <i v-tooltip.right="$t('mod.forms.once_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                </div>

                <div class="field col-12 md:col-4">
                  <label class="flex align-items-center gap-1">
                    {{ $t('mod.forms.cooldown') }}
                    <i v-tooltip.right="$t('mod.forms.cooldown_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                  <InputNumber v-model="form.cooldown_hours" :min="0" :disabled="form.once" showButtons />
                </div>
                <div class="field col-12 md:col-4">
                  <label>{{ $t('mod.forms.open_from') }}</label>
                  <DatePicker v-model="form.open_from" showTime hourFormat="24" dateFormat="dd.mm.yy" showButtonBar />
                </div>
                <div class="field col-12 md:col-4">
                  <label>{{ $t('mod.forms.open_to') }}</label>
                  <DatePicker v-model="form.open_to" showTime hourFormat="24" dateFormat="dd.mm.yy" showButtonBar />
                </div>

                <div class="field col-12">
                  <label class="flex align-items-center gap-1">
                    {{ $t('mod.forms.closed_text') }}
                    <i v-tooltip.right="$t('mod.forms.closed_text_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                  <InputText v-model="form.closed_text" />
                </div>
              </div>
            </TabPanel>

            <TabPanel value="notify">
              <div class="p-fluid formgrid grid">
                <div class="field col-12 md:col-6">
                  <label class="flex align-items-center gap-1">
                    {{ $t('mod.forms.notify_channels') }}
                    <i v-tooltip.right="$t('mod.forms.notify_channels_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                  <MultiSelect
                    v-model="form.notify_channels"
                    :options="channels"
                    :placeholder="$t('mod.forms.notify_none')"
                    display="chip"
                  />
                  <small v-if="!channels.length" class="text-color-secondary">{{ $t('mod.forms.notify_empty') }}</small>
                </div>

                <div class="field-checkbox col-12">
                  <Checkbox v-model="form.notify_author" inputId="ff-author" binary />
                  <label for="ff-author" class="flex align-items-center gap-1">
                    {{ $t('mod.forms.notify_author') }}
                    <i v-tooltip.right="$t('mod.forms.notify_author_hint')" class="pi pi-question-circle text-color-secondary" />
                  </label>
                </div>
              </div>
            </TabPanel>

            <TabPanel value="translations">
              <LocaleEditorBar
                v-model="translations.locale"
                :locales="translations.locales"
                :status="translations.status"
                :isDefault="translations.isDefault"
                @copy="translations.copyFromDefault()"
              />
              <ContentTranslationFields :translations="translations" />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </div>

    <ModFormsFieldDialog v-model:visible="fieldDialog" :field="editing" :fields="form.fields" @save="applyField" />
  </div>
</template>

<script>
import { fieldType, toSlug } from '../../../../shared/constants'

const FORM_TRANSLATABLE = [
  { path: 'title', label: 'admin.name', type: 'text' },
  { path: 'description', label: 'admin.description', type: 'textarea' },
  { path: 'success_text', label: 'mod.forms.success_text', type: 'textarea' },
  { path: 'submit_label', label: 'mod.forms.submit_label', type: 'text' },
  { path: 'closed_text', label: 'mod.forms.closed_text', type: 'text' },
]

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('mod.forms.title')) })

    return {
      site: String(useRuntimeConfig().public.baseurl || ''),
      translations: useContentTranslations('mod.forms.form', FORM_TRANSLATABLE),
      ...useAccess({ canWrite: 'mod.forms.write' }),
    }
  },
  data() {
    return {
      form: null,
      channels: [],
      universe: [],
      suggestions: [],
      fieldDialog: false,
      editing: null,
      saving: false,
      counter: 0,
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      const id = this.$route.params.id

      const [form, channels, universe] = await Promise.all([
        this.$api.get(`/mod/forms/manage/${id}`).then((res) => res.data).catch(() => null),
        this.$api.get('/mod/forms/manage/channels').then((res) => res.data).catch(() => []),
        this.$api.get('/admin/roles/autocompleate').then((res) => res.data).catch(() => []),
      ])

      if (!form) return this.$router.push('/mod/forms')

      form.fields = (form.fields || []).map((field) => ({ ...field, uid: `saved-${field.id}` }))
      form.open_from = form.open_from ? new Date(form.open_from) : null
      form.open_to = form.open_to ? new Date(form.open_to) : null
      form.notify_channels = form.notify_channels || []

      this.form = form
      this.channels = channels
      this.universe = universe
      this.translations.attach(this.form)
      await this.translations.load(form.id)
    },
    typeOf(type) {
      return fieldType(type)
    },
    openSite() {
      window.open(`${this.site}/mod/forms/${this.form.slug}`, '_blank')
    },
    searchPermission(event) {
      const query = String(event.query || '').toLowerCase()

      this.suggestions = this.universe.filter((item) => item.toLowerCase().includes(query)).slice(0, 20)
    },
    reorder(event) {
      this.form.fields = event.value
    },
    addField() {
      this.editing = null
      this.fieldDialog = true
    },
    editField(field) {
      this.editing = field
      this.fieldDialog = true
    },
    dropField(index) {
      this.form.fields.splice(index, 1)
    },
    applyField(field) {
      const index = this.editing ? this.form.fields.indexOf(this.editing) : -1

      if (index >= 0) this.form.fields.splice(index, 1, { ...field, uid: this.editing.uid })
      else this.form.fields.push({ ...field, uid: `draft-${(this.counter += 1)}` })

      this.editing = null
    },
    async save() {
      this.saving = true

      const payload = {
        title: this.form.title,
        slug: toSlug(this.form.slug),
        description: this.form.description || undefined,
        icon: this.form.icon || undefined,
        enabled: this.form.enabled,
        in_nav: this.form.in_nav,
        nav_order: this.form.nav_order || 100,
        auth_only: this.form.auth_only,
        permission: this.form.permission || undefined,
        once: this.form.once,
        cooldown_hours: this.form.cooldown_hours || 0,
        max_total: this.form.max_total || 0,
        open_from: this.form.open_from || undefined,
        open_to: this.form.open_to || undefined,
        closed_text: this.form.closed_text || undefined,
        success_text: this.form.success_text || undefined,
        submit_label: this.form.submit_label || undefined,
        notify_channels: this.form.notify_channels,
        notify_author: this.form.notify_author,
        fields: this.form.fields.map(({ uid, form, ...field }) => ({ ...field, id: field.id || undefined })),
      }

      const saved = await this.$api
        .patch(`/mod/forms/manage/${this.form.id}`, payload)
        .then((res) => res.data)
        .catch(() => null)

      if (!saved) {
        this.saving = false

        return this.$utils.notifyError(null, this.$t('admin.invalid_data'))
      }

      await this.translations.save(this.form.id)
      this.saving = false
      this.$toast.add({ severity: 'success', detail: this.$t('admin.saved'), life: 3000 })
      await this.load()
    },
  },
}
</script>
