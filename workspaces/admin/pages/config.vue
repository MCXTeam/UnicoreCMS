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

        <DataTable :value="config" :loading="loading" :filters.sync="filters" rowHover responsiveLayout="scroll" dataKey="key">
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

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="cfgDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование переменной"
            class="p-fluid"
          >
            <ValidationProvider
              name="Ключ (a-z)"
              :rules="{
                required: true,
                regex: /^[a-z_]+$/,
              }"
              v-slot="{ errors }"
            >
              <div class="field">
                <label>Ключ</label>
                <InputText :disabled="updateMode" v-model="cfgField.key" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Тип" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Тип</label>
                <Dropdown
                  :disabled="cfgField.important"
                  v-model="cfgField.type"
                  :options="types"
                  optionLabel="name"
                  optionValue="id"
                  appendTo="body"
                ></Dropdown>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field">
              <label>Значение</label>
              <InputText v-model="cfgField.value" />
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateCfg() : createCfg()"
              />
            </template>
          </Dialog>
        </ValidationObserver>
      </div>
    </div>
  </div>
</template>

<script>
import { FilterMatchMode } from 'primevue/api'
import { ValidationObserver, ValidationProvider } from 'vee-validate'

export default {
  head: {
    title: 'Конфигурация',
  },

  components: {
    ValidationObserver,
    ValidationProvider,
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

  async fetch() {
    this.loading = true
    this.cfgDialog = false
    this.config = await this.$axios.get('/config').then((res) => res.data)
    this.loading = false
  },

  methods: {
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
        await this.$axios.post('/config', this.cfgField)
        this.$toast.add({
          severity: 'success',
          detail: 'Переменная успешно добавлен',
          life: 3000,
        })
        await this.$fetch()
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
        await this.$axios.patch('/config', this.cfgField)
        this.$toast.add({
          severity: 'success',
          detail: 'Переменная успешно редактирована',
          life: 3000,
        })
        await this.$fetch()
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
            await this.$axios.delete('/config/' + key)
            this.$toast.add({
              severity: 'success',
              detail: 'Переменная успешно удалена',
              life: 3000,
            })
          } catch {}
          await this.$fetch()
        },
      })
    },
  },
}
</script>
