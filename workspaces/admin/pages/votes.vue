<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button v-if="canCreate" :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
            </div>
          </template>
        </Toolbar>
        <DataTable :value="bonuses" :loading="loading" v-model:filters="filters" rowHover responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.votes_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column field="id" header="ID" sortable></Column>
          <Column field="place" :header="$t('admin.place')" sortable />
          <Column field="bonus" :header="$t('admin.bonus')">
            <template #body="slotProps"> {{ $utils.formatCurrency('real', slotProps.data.bonus) }} </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="canUpdate"
                @click="openDialog(slotProps.data)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success mr-2"
              />
              <Button
                v-if="canDelete"
                @click="removeBonus(slotProps.data.id)"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="bonusDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            :header="$t('admin.vote_dialog')"
            class="p-fluid"
          >
            <VeeField
              v-model="bonus.place"
              name="place"
              :label="$t('admin.place')"
              rules="required|min:0"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>{{ $t('admin.place') }}<span class="p-error"> *</span></label>
                <InputNumber :modelValue="value" @update:modelValue="handleChange" @input="handleChange($event.value)" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="bonus.bonus"
              name="bonus"
              :label="$t('admin.vote_bonus_amount')"
              rules="required|min:0"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>{{ $t('admin.vote_bonus_amount') }}<span class="p-error"> *</span></label>
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
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
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
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.votes_title')) })
    const access = useAccess({
      canCreate: 'panel.votes.create',
      canUpdate: 'panel.votes.update',
      canDelete: 'panel.votes.delete',
    })

    return {
      ...access,
      runtimeConfig: useRuntimeConfig().public,
    }
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
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.bonuses = await this.$api.get('/cabinet/votes/gifts').then((res) => res.data)
      this.bonusDialog = false
      this.loading = false
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
          place: null,
        }
      }
      this.bonusDialog = true
    },
    async createBonus() {
      this.loading = true
      try {
        await this.$api.post('/cabinet/votes/gifts', this.bonus)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.vote_created'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
      this.loading = false
    },
    async updateBonus() {
      this.loading = true
      try {
        await this.$api.patch('/cabinet/votes/gifts/' + this.bonus.id, this.$_.omit(this.bonus, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.vote_updated'),
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
      this.loading = false
    },
    async removeBonus(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/cabinet/votes/gifts/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.vote_deleted'),
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
