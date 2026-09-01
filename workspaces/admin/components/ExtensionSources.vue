<template>
  <Dialog
    :visible="visible"
    modal
    :header="$t('admin.catalog_sources_title')"
    :style="{ width: '860px' }"
    @update:visible="$emit('update:visible', $event)"
    @show="load"
  >
    <p class="mt-0 mb-3 text-color-secondary">{{ $t('admin.catalog_sources_hint') }}</p>

    <DataTable :value="rows" :loading="loading" responsiveLayout="scroll" dataKey="id" class="mb-4">
      <Column :header="$t('admin.name')">
        <template #body="slotProps">
          <div class="font-medium">{{ slotProps.data.name }}</div>
          <small class="text-color-secondary">{{ slotProps.data.location }}</small>
        </template>
      </Column>
      <Column :header="$t('admin.catalog_source_type')" :style="{ width: '9rem' }">
        <template #body="slotProps">{{ $t(`admin.catalog_source_type_${slotProps.data.type}`) }}</template>
      </Column>
      <Column :header="$t('admin.catalog_token')" :style="{ width: '8rem' }">
        <template #body="slotProps">
          <Tag v-if="slotProps.data.hasToken" severity="info" :value="$t('admin.catalog_token_set')" />
        </template>
      </Column>
      <Column :header="$t('admin.status')" :style="{ width: '8rem' }">
        <template #body="slotProps">
          <Tag
            :severity="slotProps.data.enabled ? 'success' : 'secondary'"
            :value="$t(slotProps.data.enabled ? 'admin.enabled' : 'admin.disabled')"
          />
        </template>
      </Column>
      <Column :style="{ width: '9rem' }" :bodyStyle="{ 'text-align': 'right' }">
        <template #body="slotProps">
          <Button icon="pi pi-pencil" class="p-button-rounded p-button-text" :disabled="loading" @click="edit(slotProps.data)" />
          <Button
            v-if="!slotProps.data.builtin"
            icon="pi pi-trash"
            class="p-button-rounded p-button-text p-button-danger"
            :disabled="loading"
            @click="remove(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <div class="p-fluid formgrid grid">
      <div class="field col-12 md:col-6">
        <label>{{ $t('admin.name') }}</label>
        <InputText v-model="form.name" />
      </div>
      <div class="field col-12 md:col-6">
        <label>{{ $t('admin.catalog_source_type') }}</label>
        <Select
          v-model="form.type"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
          :disabled="form.builtin"
          appendTo="body"
        />
      </div>
      <div class="field col-12">
        <label>{{ $t(form.type === 'github' ? 'admin.catalog_source_repo' : 'admin.catalog_source_url') }}</label>
        <InputText v-model="form.location" :placeholder="form.type === 'github' ? 'owner/repo' : 'https://'" :disabled="form.builtin" />
        <small class="text-color-secondary">{{
          $t(form.type === 'github' ? 'admin.catalog_source_repo_hint' : 'admin.catalog_source_url_hint')
        }}</small>
      </div>
      <div class="field col-12">
        <label>{{ $t('admin.catalog_token') }}</label>
        <Password v-model="form.token" :feedback="false" toggleMask :placeholder="form.hasToken ? $t('admin.catalog_token_keep') : ''" />
        <small class="text-color-secondary">{{ $t('admin.catalog_token_hint') }}</small>
      </div>
      <div class="field col-12 flex align-items-center gap-2">
        <Checkbox :binary="true" inputId="source-enabled" v-model="form.enabled" />
        <label for="source-enabled" class="m-0">{{ $t('admin.enabled') }}</label>
      </div>
    </div>

    <template #footer>
      <Button v-if="form.id" :label="$t('admin.catalog_source_new')" icon="pi pi-plus" class="p-button-text" @click="reset" />
      <Button :label="$t('common.close')" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
      <Button
        :label="$t(form.id ? 'common.save' : 'admin.catalog_source_add')"
        icon="pi pi-check"
        class="p-button-text"
        :loading="saving"
        :disabled="!form.name || !form.location"
        @click="save"
      />
    </template>
  </Dialog>
</template>

<script>
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { EXTENSION_SOURCE_TYPES } from 'unicore-common/extensions'

const blank = (kind) => ({
  id: null,
  name: '',
  kind,
  type: 'github',
  location: '',
  token: '',
  enabled: true,
  builtin: false,
  hasToken: false,
})

export default {
  props: {
    visible: { type: Boolean, default: false },
    kind: { type: String, required: true },
  },
  emits: ['update:visible', 'changed'],
  setup() {
    return { toast: useToast(), confirm: useConfirm() }
  },
  data() {
    return {
      sources: [],
      loading: false,
      saving: false,
      form: blank(this.kind),
    }
  },
  computed: {
    rows() {
      return this.sources.filter((source) => source.kind === this.kind)
    },
    typeOptions() {
      return EXTENSION_SOURCE_TYPES.map((type) => ({ value: type, label: this.$t(`admin.catalog_source_type_${type}`) }))
    },
  },
  methods: {
    reset() {
      this.form = blank(this.kind)
    },
    async load() {
      this.loading = true
      this.sources = await this.$api
        .get('/admin/extensions/sources')
        .then((res) => res.data)
        .catch(() => [])
      this.loading = false
      this.reset()
    },
    edit(source) {
      this.form = { ...blank(this.kind), ...source, token: '' }
    },
    payload() {
      const payload = {
        name: this.form.name,
        kind: this.kind,
        type: this.form.type,
        location: this.form.location,
        enabled: this.form.enabled,
      }

      if (this.form.token) payload.token = this.form.token

      return payload
    },
    async save() {
      this.saving = true

      try {
        if (this.form.id) await this.$api.patch(`/admin/extensions/sources/${this.form.id}`, this.payload())
        else await this.$api.post('/admin/extensions/sources', this.payload())

        this.toast.add({ severity: 'success', summary: this.$t('admin.saved'), life: 3000 })
        await this.load()
        this.$emit('changed')
      } catch (error) {
        this.toast.add({
          severity: 'error',
          summary: this.$t('admin.catalog_source_error_save'),
          detail: error.response?.data?.message || this.$t('common.unknown_error'),
          life: 8000,
        })
      }

      this.saving = false
    },
    remove(source) {
      this.confirm.require({
        message: this.$t('admin.catalog_source_remove_confirm'),
        header: source.name,
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.$t('admin.extension_remove'),
        rejectLabel: this.$t('admin.extension_keep'),
        accept: async () => {
          await this.$api.delete(`/admin/extensions/sources/${source.id}`).catch(() => null)
          await this.load()
          this.$emit('changed')
        },
      })
    },
  },
}
</script>
