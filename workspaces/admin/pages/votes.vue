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
        <DataTable :value="bonuses" :loading="loading" :filters.sync="filters" rowHover responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление бонусами голосования</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column field="id" header="ID" sortable></Column>
          <Column field="place" header="Место" sortable />
          <Column field="bonus" header="Бонус">
            <template #body="slotProps"> {{ $utils.formatCurrency(slotProps.data.bonus) }} </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removeBonus(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="bonusDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            header="Создание/редактирование бонуса"
            class="p-fluid"
          >
            <ValidationProvider name="Место" rules="required|min:0" v-slot="{ errors }">
              <div class="field">
                <label>Место</label>
                <InputNumber v-model="bonus.place" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Бонус рублей на баланс" rules="required|min:0" v-slot="{ errors }">
              <div class="field">
                <label>Бонус рублей на баланс</label>
                <InputNumber v-model="bonus.bonus" currency="RUB" locale="ru-RU" mode="currency" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateBonus() : createBonus()"
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
    title: 'Бонусы голосования',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      bonuses: null,
      loading: true,
      updateMode: false,
      bonus: {
        id: null,
        bonus: null,
        place: null,
      },
      bonusDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.bonuses = await this.$axios.get('/cabinet/votes/gifts').then((res) => res.data)
    this.bonusDialog = false
    this.loading = false
  },
  methods: {
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
          place: null,
        }
      }
      this.bonusDialog = true
    },
    async createBonus() {
      this.loading = true
      try {
        await this.$axios.post('/cabinet/votes/gifts', this.bonus)
        this.$toast.add({
          severity: 'success',
          detail: 'Бонус успешно добавлен',
          life: 3000,
        })
        await this.$fetch()
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
        await this.$axios.patch('/cabinet/votes/gifts' + this.bonus.id, this.$_.omit(this.bonus, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Бонус успешно редактирован',
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
      this.loading = false
    },
    async removeBonus(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/cabinet/votes/gifts' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Бонус успешно удален',
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
