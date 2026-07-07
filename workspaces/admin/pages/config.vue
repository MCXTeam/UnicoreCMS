<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button @click="openDialog()" label="Создать" icon="pi pi-plus" class="p-button-success mr-2" />
            </div>
          </template>
        </Toolbar>

        <DataTable :value="config" :loading="loading" v-model:filters="filters" rowHover responsiveLayout="scroll" dataKey="key">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление переменными</h5>
            </div>
          </template>
          <Column sortable field="key" header="Ключ"></Column>
          <Column sortable field="value" header="Значение"></Column>
          <Column :styles="{ width: '12rem' }">
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
            header="Создание/редактирование переменной"
            class="p-fluid"
          >
            <VeeField
              v-model="cfgField.key"
              name="key"
              label="Ключ (a-z)"
              :rules="{ required: true, regex: /^[a-z_]+$/ }"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>Ключ</label>
                <InputText :disabled="updateMode" :modelValue="value" @update:modelValue="handleChange" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField v-model="cfgField.type" name="type" label="Тип" rules="required" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Тип</label>
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
              <label>Значение</label>
              <InputText v-model="cfgField.value" />
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
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
import { Form, Field } from 'vee-validate'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },

  setup() {
    useHead({ title: 'Конфигурация' })
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
          detail: 'Переменная успешно добавлен',
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: 'Введены некоректные данные',
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
          detail: 'Переменная успешно редактирована',
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: 'Введены некоректные данные',
          life: 3000,
        })
      }
    },
    async removeCfg(key) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/config/' + key)
            this.$toast.add({
              severity: 'success',
              detail: 'Переменная успешно удалена',
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
