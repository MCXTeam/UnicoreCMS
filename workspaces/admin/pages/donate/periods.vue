<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button label="Создать" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
            </div>
          </template>
        </Toolbar>
        <DataTable
          :value="periods"
          :loading="loading"
          :rows="50"
          paginator
          v-model:filters="filters"
          rowHover
          responsiveLayout="scroll"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление периодами</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column field="id" header="ID" sortable></Column>
          <Column field="name" header="Название" sortable></Column>
          <Column field="expire" header="Время">
            <template #body="slotProps">
              {{ $moment.duration(slotProps.data.expire, 'seconds').format() }}
            </template>
          </Column>
          <Column field="multiplier" header="Множитель">
            <template #body="slotProps"> x{{ slotProps.data.multiplier }} </template>
          </Column>
          <Column :style="{ width: '8rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removePeriod(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="periodDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            header="Создание/редактирование периода"
            class="p-fluid"
          >
            <VeeField
              v-model="period.name"
              name="name"
              label="Название"
              rules="required"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>Название</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" :class="errorMessage && 'p-invalid'" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="period.expire"
              name="expire"
              label="Время в секундах"
              rules="required|min:0"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>Время в секундах (0 - вечный)</label>
                <InputNumber
                  :modelValue="value"
                  @update:modelValue="handleChange"
                  @input="handleChange($event.value)"
                  @blur="handleBlur"
                  suffix=" сек."
                  :class="errorMessage && 'p-invalid'"
                />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="period.multiplier"
              name="multiplier"
              label="Множитель цены"
              rules="min:0"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>Множитель цены</label>
                <InputNumber
                  :modelValue="value"
                  @update:modelValue="handleChange"
                  @input="handleChange($event.value)"
                  @blur="handleBlur"
                  mode="decimal"
                  :min-fraction-digits="2"
                  prefix="x"
                  :class="errorMessage && 'p-invalid'"
                />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updatePeriod() : createPeriod()"
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
    useHead({ title: 'Периоды' })
  },
  data() {
    return {
      periods: null,
      loading: true,
      updateMode: false,
      period: {
        id: null,
        name: null,
        expire: null,
        multiplier: 1,
      },
      periodDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.periods = await this.$api.get('/donates/periods').then((res) => res.data)

      this.periodDialog = false
      this.loading = false
    },
    hideDialog() {
      this.periodDialog = false
    },
    openDialog(period = null) {
      this.updateMode = !!period
      if (period) {
        this.period = this.$_.pick(period, this.$_.deepKeys(this.period))
      } else {
        this.period = {
          id: null,
          name: null,
          expire: null,
          multiplier: 1,
        }
      }
      this.periodDialog = true
    },
    async createPeriod() {
      this.loading = true
      try {
        await this.$api.post('/donates/periods', this.period)
        this.$toast.add({
          severity: 'success',
          detail: 'Период успешно добавлен',
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          detail: 'Введены некоректные данные',
          life: 3000,
        })
      }
    },
    async updatePeriod() {
      this.loading = true
      try {
        await this.$api.patch('/donates/periods/' + this.period.id, this.$_.omit(this.period, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Период успешно редактирован',
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
    async removePeriod(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/periods/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Период успешно удален',
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
