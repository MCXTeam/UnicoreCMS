<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2 flex align-items-center gap-2">
              <Select
                v-model="code"
                :options="locales"
                optionLabel="name"
                optionValue="code"
                :placeholder="$t('admin.language')"
                :style="{ width: '14rem' }"
              />
              <Button :label="$t('admin.add_key')" icon="pi pi-plus" class="p-button-success" @click="openKeyDialog" />
            </div>
          </template>
          <template v-slot:end>
            <div class="my-2 flex gap-2">
              <Button :label="$t('admin.languages')" icon="pi pi-globe" class="p-button-secondary" @click="localesDialog = true" />
              <Button :disabled="loading || !changed" :label="$t('common.save')" icon="pi pi-check" @click="save" />
            </div>
          </template>
        </Toolbar>

        <DataTable
          :value="rows"
          :loading="loading"
          :rows="25"
          paginator
          v-model:filters="filters"
          :globalFilterFields="['key', 'value']"
          rowHover
          responsiveLayout="scroll"
          dataKey="key"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.translations') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <template #empty>{{ $t('admin.no_keys') }}</template>
          <Column sortable field="key" :header="$t('admin.key')" :style="{ width: '22rem' }">
            <template #body="slotProps">
              <span class="font-mono">{{ slotProps.data.key }}</span>
            </template>
          </Column>
          <Column field="value" :header="$t('admin.value')">
            <template #body="slotProps">
              <InputText
                class="w-full"
                :modelValue="messages[slotProps.data.key]"
                @update:modelValue="setMessage(slotProps.data.key, $event)"
                :placeholder="original[slotProps.data.key] ? '' : $t('admin.no_translation')"
              />
            </template>
          </Column>
          <Column :style="{ width: '6rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="removeKey(slotProps.data.key)" icon="pi pi-trash" class="p-button-rounded p-button-warning" />
            </template>
          </Column>
        </DataTable>

        <small class="block mt-3">{{ $t('admin.locales_hint') }}</small>
      </div>
    </div>

    <VeeForm v-slot="{ meta }">
      <Dialog
        :style="{ width: '520px' }"
        v-model:visible="keyDialog"
        :closable="false"
        :modal="true"
        :header="$t('admin.new_key')"
        class="p-fluid"
      >
        <VeeField
          v-model="newKey.key"
          name="key"
          :label="$t('admin.key')"
          :rules="{ required: true, regex: /^[a-z0-9_]+(\.[a-z0-9_]+)+$/ }"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('admin.key') }}<span class="p-error"> *</span></label>
            <InputText :modelValue="value" @update:modelValue="handleChange" class="font-mono" autofocus placeholder="header.servers" />
            <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            <small v-else>{{ $t('admin.key_hint') }}</small>
          </div>
        </VeeField>
        <div class="field">
          <label>{{ $t('admin.value') }}</label>
          <Textarea v-model="newKey.value" :autoResize="true" rows="2" />
        </div>
        <template #footer>
          <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="keyDialog = false" />
          <Button :disabled="!meta.valid" :label="$t('admin.add')" icon="pi pi-check" class="p-button-text" @click="addKey" />
        </template>
      </Dialog>
    </VeeForm>

    <Dialog :style="{ width: '760px' }" v-model:visible="localesDialog" :modal="true" :header="$t('admin.languages')">
      <Toolbar class="mb-4">
        <template v-slot:start>
          <Button :label="$t('admin.add_language')" icon="pi pi-plus" class="p-button-success" @click="openLocaleDialog()" />
        </template>
      </Toolbar>
      <DataTable :value="locales" dataKey="code" responsiveLayout="scroll">
        <Column field="code" :header="$t('admin.code')" :style="{ width: '6rem' }"></Column>
        <Column field="name" :header="$t('admin.name')"></Column>
        <Column :header="$t('admin.enabled')" :style="{ width: '8rem' }">
          <template #body="slotProps">
            <i :class="slotProps.data.enabled ? 'pi pi-check text-green-500' : 'pi pi-times text-red-500'" />
          </template>
        </Column>
        <Column :header="$t('admin.is_default')" :style="{ width: '9rem' }">
          <template #body="slotProps">
            <i v-if="slotProps.data.is_default" class="pi pi-star-fill text-yellow-500" />
          </template>
        </Column>
        <Column :style="{ width: '9rem' }" :bodyStyle="{ 'text-align': 'right' }">
          <template #body="slotProps">
            <Button @click="openLocaleDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
            <Button
              v-if="!slotProps.data.is_default"
              @click="removeLocale(slotProps.data.code)"
              icon="pi pi-trash"
              class="p-button-rounded p-button-warning"
            />
          </template>
        </Column>
      </DataTable>
      <small class="block mt-3">{{ $t('admin.locales_default_hint') }}</small>
    </Dialog>

    <VeeForm v-slot="{ meta }">
      <Dialog
        :style="{ width: '520px' }"
        v-model:visible="localeDialog"
        :closable="false"
        :modal="true"
        :header="$t('admin.language')"
        class="p-fluid"
      >
        <VeeField
          v-model="locale.code"
          name="code"
          :label="$t('admin.code')"
          :rules="{ required: true, regex: /^[a-z]{2}$/ }"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('admin.code') }}<span class="p-error"> *</span></label>
            <InputText :modelValue="value" @update:modelValue="handleChange" :disabled="localeUpdateMode" class="font-mono" />
            <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            <small v-else>{{ $t('admin.locale_code_hint') }}</small>
          </div>
        </VeeField>
        <VeeField
          v-model="locale.name"
          name="name"
          :label="$t('admin.name')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('admin.name') }}<span class="p-error"> *</span></label>
            <InputText :modelValue="value" @update:modelValue="handleChange" placeholder="Deutsch" />
            <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
            <small v-else>{{ $t('admin.locale_name_hint') }}</small>
          </div>
        </VeeField>
        <div class="field">
          <label>{{ $t('admin.order') }}</label>
          <InputNumber v-model="locale.priority" :useGrouping="false" />
          <small>{{ $t('admin.order_hint') }}</small>
        </div>
        <div class="field flex align-items-center gap-2">
          <Checkbox v-model="locale.enabled" :binary="true" inputId="locale-enabled" :disabled="locale.is_default" />
          <label for="locale-enabled" class="m-0">{{ $t('admin.show_on_site') }}</label>
        </div>
        <div class="field flex align-items-center gap-2">
          <Checkbox v-model="locale.is_default" :binary="true" inputId="locale-default" />
          <label for="locale-default" class="m-0">{{ $t('admin.default_language') }}</label>
        </div>
        <template #footer>
          <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="localeDialog = false" />
          <Button
            :disabled="!meta.valid"
            :label="$t('common.save')"
            icon="pi pi-check"
            class="p-button-text"
            @click="localeUpdateMode ? updateLocale() : createLocale()"
          />
        </template>
      </Dialog>
    </VeeForm>
  </div>
</template>

<script>
import { FilterMatchMode } from '@primevue/core/api'
import { Form, Field } from 'vee-validate'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_locales')) })
  },
  data() {
    return {
      loading: true,
      locales: [],
      keys: [],
      code: null,
      messages: {},
      original: {},
      keyDialog: false,
      newKey: {
        key: null,
        value: null,
      },
      localesDialog: false,
      localeDialog: false,
      localeUpdateMode: false,
      locale: {
        code: null,
        name: null,
        enabled: true,
        is_default: false,
        priority: 0,
      },
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  computed: {
    rows() {
      return this.keys.map((key) => ({ key, value: this.messages[key] || '' }))
    },
    changed() {
      return this.keys.some((key) => (this.messages[key] || '') !== (this.original[key] || ''))
    },
  },
  watch: {
    code() {
      this.loadMessages()
    },
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.locales = await this.$api.get('/locales/all').then((res) => res.data)
      this.keys = await this.$api.get('/locales/keys').then((res) => res.data)
      if (!this.locales.find((locale) => locale.code === this.code)) {
        this.code = (this.locales.find((locale) => locale.is_default) || this.locales[0])?.code || null
      }
      await this.loadMessages()
    },
    async loadMessages() {
      if (!this.code) {
        this.messages = {}
        this.original = {}
        this.loading = false
        return
      }
      this.loading = true
      this.original = await this.$api.get(`/locales/${this.code}/messages`).then((res) => res.data)
      this.messages = { ...this.original }
      this.loading = false
    },
    setMessage(key, value) {
      this.messages = { ...this.messages, [key]: value }
    },
    async save() {
      this.loading = true
      const messages = this.keys.reduce((result, key) => {
        if ((this.messages[key] || '') !== (this.original[key] || '')) result[key] = this.messages[key] || ''
        return result
      }, {})
      try {
        await this.$api.patch(`/locales/${this.code}/messages`, { messages })
        this.$toast.add({ severity: 'success', detail: this.$t('admin.translations_saved'), life: 3000 })
        await this.loadMessages()
      } catch {
        this.loading = false
        this.$toast.add({ severity: 'error', detail: this.$t('admin.translations_save_failed'), life: 3000 })
      }
    },
    openKeyDialog() {
      this.newKey = { key: null, value: null }
      this.keyDialog = true
    },
    async addKey() {
      if (this.keys.includes(this.newKey.key)) {
        this.$toast.add({ severity: 'error', detail: this.$t('admin.key_exists'), life: 3000 })
        return
      }
      this.loading = true
      this.keyDialog = false
      try {
        await this.$api.patch(`/locales/${this.code}/messages`, { messages: { [this.newKey.key]: this.newKey.value || '' } })
        await this.load()
      } catch {
        this.loading = false
        this.$toast.add({ severity: 'error', detail: this.$t('admin.key_add_failed'), life: 3000 })
      }
    },
    removeKey(key) {
      this.$confirm.require({
        message: this.$t('admin.key_delete_confirm', { key }),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete(`/locales/keys/${encodeURIComponent(key)}`)
          } catch {}
          await this.load()
        },
      })
    },
    openLocaleDialog(locale = null) {
      this.localeUpdateMode = !!locale
      this.locale = locale
        ? this.$_.pick(locale, ['code', 'name', 'enabled', 'is_default', 'priority'])
        : { code: null, name: null, enabled: true, is_default: false, priority: this.locales.length }
      this.localeDialog = true
    },
    async createLocale() {
      this.localeDialog = false
      try {
        await this.$api.post('/locales', this.locale)
        this.$toast.add({ severity: 'success', detail: this.$t('admin.locale_created'), life: 3000 })
        await this.load()
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          detail: err.response?.status === 409 ? this.$t('admin.locale_code_exists') : this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async updateLocale() {
      this.localeDialog = false
      try {
        await this.$api.patch(`/locales/${this.locale.code}`, this.locale)
        this.$toast.add({ severity: 'success', detail: this.$t('admin.locale_updated'), life: 3000 })
        await this.load()
      } catch {
        this.$toast.add({ severity: 'error', detail: this.$t('admin.invalid_data'), life: 3000 })
      }
    },
    removeLocale(code) {
      this.$confirm.require({
        message: this.$t('admin.locale_delete_confirm'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          try {
            await this.$api.delete(`/locales/${code}`)
            this.$toast.add({ severity: 'success', detail: this.$t('admin.locale_deleted'), life: 3000 })
          } catch {}
          await this.load()
        },
      })
    },
  },
}
</script>
