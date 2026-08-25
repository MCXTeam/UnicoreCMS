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
              <h5 class="m-0">{{ $t('admin.periods_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column field="id" header="ID" sortable></Column>
          <Column field="name" :header="$t('admin.name')" sortable></Column>
          <Column field="expire" :header="$t('admin.time')">
            <template #body="slotProps">
              {{ slotProps.data.expire ? $utils.formatDuration(slotProps.data.expire, 'seconds') : $t('admin.forever') }}
            </template>
          </Column>
          <Column field="multiplier" :header="$t('admin.multiplier')">
            <template #body="slotProps"> x{{ slotProps.data.multiplier }} </template>
          </Column>
          <Column :style="{ width: '8rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="canUpdate"
                @click="openDialog(slotProps.data)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success mr-2"
              />
              <Button
                v-if="canDelete"
                @click="removePeriod(slotProps.data.id)"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="periodDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            :header="$t('admin.period_dialog')"
            class="p-fluid"
          >
            <LocaleEditorBar
              v-model="translations.locale"
              :locales="translations.locales"
              :status="translations.status"
              :isDefault="translations.isDefault"
              @copy="translations.copyFromDefault()"
            />
            <template v-if="translations.isDefault">
              <VeeField
                v-model="period.name"
                name="name"
                :label="$t('admin.name')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.name') }}</label>
                  <InputText
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @blur="handleBlur"
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-model="period.expire"
                name="expire"
                :label="$t('admin.period_seconds')"
                rules="required|min:0"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.period_seconds_hint') }}</label>
                  <InputNumber
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @input="handleChange($event.value)"
                    @blur="handleBlur"
                    :suffix="` ${$t('admin.seconds_suffix')}`"
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-model="period.multiplier"
                name="multiplier"
                :label="$t('admin.price_multiplier')"
                rules="min:0"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.price_multiplier') }}</label>
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
            </template>
            <ContentTranslationFields v-else :translations="translations" />
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
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
import { Permission } from 'unicore-common/enums'
import { FilterMatchMode } from '@primevue/core/api'
import { Form, Field } from 'vee-validate'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const translations = useContentTranslations('period')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_periods')) })

    const access = useAccess({
      canCreate: Permission.EditorDonatePeriodsCreate,
      canUpdate: Permission.EditorDonatePeriodsUpdate,
      canDelete: Permission.EditorDonatePeriodsDelete,
    })

    return {
      ...access,
      translations,
    }
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
    async openDialog(period = null) {
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
      this.translations.attach(this.period)
      await this.translations.load(period ? period.id : null)
      this.periodDialog = true
    },
    async createPeriod() {
      this.loading = true
      try {
        const { data } = await this.$api.post('/donates/periods', this.period)

        await this.translations.save(data.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.period_created'),
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
    },
    async updatePeriod() {
      this.loading = true
      try {
        await this.$api.patch('/donates/periods/' + this.period.id, this.$_.omit(this.period, 'id'))

        await this.translations.save(this.period.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.period_updated'),
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
    async removePeriod(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/periods/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.period_deleted'),
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
