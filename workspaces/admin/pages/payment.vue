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
        <DataTable :value="bonuses" :loading="loading" v-model:filters="filters" rowHover responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление бонусами пополнения</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column field="id" header="ID" sortable></Column>
          <Column field="amount" header="Сумма" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center">
                <Avatar v-if="slotProps.data.icon" :image="`${runtimeConfig.apiBaseurl + '/' + slotProps.data.icon}`" shape="circle" />
                <Avatar v-else icon="pi pi-image" shape="circle" />
                <span class="ml-2">{{ $utils.formatCurrency('real', slotProps.data.amount) }}%</span>
              </div>
            </template>
          </Column>
          <Column field="bonus" header="Бонуск пополнению">
            <template #body="slotProps"> {{ slotProps.data.bonus }}% </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button @click="removeBonus(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="fileDialog" :style="{ width: '400px' }" :modal="true" header="Иконка бонуса" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <Avatar v-if="bonus.icon" :image="`${runtimeConfig.apiBaseurl + '/' + bonus.icon}`" size="xlarge" shape="circle" />
            <Avatar v-else icon="pi pi-image" size="xlarge" shape="circle" />
            <div class="field ml-6 mb-0">
              <Button label="Загрузить" icon="pi pi-upload" @click="$refs.fileInput.choose()" />
              <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeIcon()" />
              <FileUpload
                ref="fileInput"
                :pt="{ root: { class: 'hidden' } }"
                mode="basic"
                name="file"
                accept="image/*"
                :auto="true"
                :customUpload="true"
                @uploader="uploadIcon"
              />
            </div>
          </div>
        </Dialog>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="bonusDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            header="Создание/редактирование бонуса"
            class="p-fluid"
          >
            <VeeField
              v-model="bonus.amount"
              name="amount"
              label="Сумма"
              rules="required|min:0"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>Сумма (условие >=)</label>
                <InputNumber
                  :modelValue="value"
                  @update:modelValue="handleChange"
                  @input="handleChange($event.value)"
                  mode="decimal"
                  :minFractionDigits="runtimeConfig.realDecimals"
                  :maxFractionDigits="runtimeConfig.realDecimals"
                />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="bonus.bonus"
              name="bonus"
              label="Бонус к пополнению"
              rules="required|min:0"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>Бонус к пополнению</label>
                <InputNumber :modelValue="value" @update:modelValue="handleChange" @input="handleChange($event.value)" suffix="%" />
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
                @click="updateMode ? updateBonus() : createBonus()"
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
    useHead({ title: 'Бонусы пополнения' })
    return { runtimeConfig: useRuntimeConfig().public }
  },
  data() {
    return {
      bonuses: null,
      loading: true,
      updateMode: false,
      fileDialog: false,
      bonus: {
        id: null,
        bonus: null,
        icon: null,
        amount: null,
      },
      bonusDialog: false,
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
      this.bonuses = await this.$api.get('/payment/bonuses').then((res) => res.data)

      this.bonusDialog = false
      this.fileDialog = false
      this.loading = false
    },
    async openFileDialog(bonus) {
      this.bonus = this.$_.pick(bonus, this.$_.deepKeys(this.bonus))
      this.fileDialog = true
    },
    hideDialog() {
      this.bonusDialog = false
    },
    openDialog(bonus = null) {
      this.updateMode = !!bonus
      if (bonus) {
        this.bonus = this.$_.pick(bonus, this.$_.deepKeys(this.bonus))
      } else {
        this.bonus = {
          id: null,
          bonus: null,
          icon: null,
          amount: null,
        }
      }
      this.bonusDialog = true
    },
    async createBonus() {
      this.loading = true
      try {
        await this.$api.post('/payment/bonuses', this.bonus)
        this.$toast.add({
          severity: 'success',
          detail: 'Бонус успешно добавлен',
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
      this.loading = false
    },
    async updateBonus() {
      this.loading = true
      try {
        await this.$api.patch('/payment/bonuses/' + this.bonus.id, this.$_.omit(this.bonus, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Бонус успешно редактирован',
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
      this.loading = false
    },
    async removeBonus(id) {
      this.loading = true
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/payment/bonuses/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Бонус успешно удален',
              life: 3000,
            })
          } catch {}
          await this.load()
        },
      })
      this.loading = false
    },
    async uploadIcon(event) {
      this.loading = true
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.patch(`/payment/bonuses/icon/` + this.bonus.id, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Картинка успешно обновлена',
          life: 3000,
        })
        await this.load()
      } catch {
        this.$toast.add({
          severity: 'error',
          detail: 'Поддерживаются только изображения',
          life: 3000,
        })
      }
      this.loading = false
    },
    async removeIcon() {
      this.loading = true
      try {
        await this.$api.delete(`/payment/bonuses/icon/` + this.bonus.id)
        this.$toast.add({
          severity: 'success',
          detail: 'Картинка успешно удалена',
          life: 3000,
        })
        await this.load()
      } catch {}
      this.loading = false
    },
  },
}
</script>
