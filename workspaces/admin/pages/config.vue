<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button @click="openDialog()" :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" />
            </div>
          </template>
        </Toolbar>

        <DataTable :value="config" :loading="loading" v-model:filters="filters" rowHover responsiveLayout="scroll" dataKey="key">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.config_title') }}</h5>
            </div>
          </template>
          <Column sortable field="key" :header="$t('admin.key')">
            <template #body="slotProps">
              <div>{{ slotProps.data.key }}</div>
              <small class="text-500">{{ $t(hint(slotProps.data.key).title) }}</small>
            </template>
          </Column>
          <Column :header="$t('admin.description')">
            <template #body="slotProps">
              <small class="text-500">{{ $t(hint(slotProps.data.key).hint) }}</small>
            </template>
          </Column>
          <Column sortable field="value" :header="$t('admin.value')"></Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button
                v-if="!slotProps.data.important"
                @click="removeCfg(slotProps.data.key)"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="cfgDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            :header="$t('admin.config_dialog')"
            class="p-fluid"
          >
            <VeeField
              v-model="cfgField.key"
              name="key"
              :label="$t('admin.config_key_hint')"
              :rules="{ required: true, regex: /^[a-z_]+$/ }"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>{{ $t('admin.key') }}<span class="p-error"> *</span></label>
                <InputText :disabled="updateMode" :modelValue="value" @update:modelValue="handleChange" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="cfgField.type"
              name="type"
              :label="$t('admin.type')"
              rules="required"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>{{ $t('admin.type') }}<span class="p-error"> *</span></label>
                <Select
                  :disabled="cfgField.important"
                  :modelValue="value"
                  @update:modelValue="handleChange"
                  :options="types"
                  optionLabel="name"
                  optionValue="id"
                  appendTo="body"
                ></Select>
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <div class="field">
              <label>{{ $t('admin.value') }}</label>
              <InputText v-model="cfgField.value" />
              <small v-if="hint(cfgField.key).hint" class="text-500">{{ $t(hint(cfgField.key).hint) }}</small>
            </div>
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateCfg() : createCfg()"
              />
            </template>
          </Dialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { FilterMatchMode } from '@primevue/core/api'
import { CONFIG_HINTS } from '~/constants'
import { Form, Field } from 'vee-validate'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },

  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_settings')) })
  },

  data() {
    return {
      config: null,
      loading: true,
      updateMode: false,
      cfgField: {
        key: null,
        value: null,
        type: null,
        important: null,
      },
      cfgDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
      types: [
        { id: 0, name: 'Number' },
        { id: 1, name: 'String' },
        { id: 2, name: 'Boolean' },
      ],
    }
  },

  mounted() {
    this.load()
  },

  methods: {
    hint(key) {
      return CONFIG_HINTS[key] || { title: '', hint: '' }
    },
    async load() {
      this.loading = true
      this.cfgDialog = false
      this.config = await this.$api.get('/config').then((res) => res.data)
      this.loading = false
    },
    hideDialog() {
      this.cfgDialog = false
    },
    async openDialog(cfgField = null) {
      this.updateMode = !!cfgField
      if (cfgField) {
        this.cfgField = this.$_.pick(cfgField, this.$_.deepKeys(this.cfgField))
      } else {
        this.cfgField = {
          key: null,
          value: null,
          type: null,
          important: null,
        }
      }
      this.cfgDialog = true
    },
    async createCfg() {
      this.loading = true
      try {
        await this.$api.post('/config', this.cfgField)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.config_created'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async updateCfg() {
      this.loading = true
      try {
        await this.$api.patch('/config', this.cfgField)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.config_updated'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async removeCfg(key) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/config/' + key)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.config_deleted'),
              life: 3000,
            })
          } catch {}
          await this.load()
        },
      })
    },
  },
}
</script>
