<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button v-if="canCreate" :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
                v-if="canDeleteMany"
                :label="$t('admin.delete')"
                icon="pi pi-trash"
                class="p-button-danger"
                :disabled="!selected || !selected.length"
                @click="removeMany()"
              />
            </div>
          </template>
        </Toolbar>

        <DataTable
          :value="gifts"
          :loading="loading"
          :rows="20"
          paginator
          v-model:filters="filters"
          rowHover
          responsiveLayout="scroll"
          v-model:selection="selected"
          dataKey="id"
          filterDisplay="menu"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.gifts_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column sortable field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column field="promocode" :header="$t('admin.promocode')" sortable></Column>
          <Column field="type" :header="$t('admin.type')" sortable>
            <template #body="slotProps">
              {{ types.find((type) => type.value == slotProps.data.type).name }}
            </template>
          </Column>
          <Column field="type" :header="$t('admin.uses')" sortable>
            <template #body="slotProps">
              {{
                slotProps.data.max_activations
                  ? `${slotProps.data.activations}/${slotProps.data.max_activations}`
                  : `${slotProps.data.activations}/∞`
              }}
            </template>
          </Column>
          <Column field="type" :header="$t('admin.active_until')" sortable>
            <template #body="slotProps">
              {{ slotProps.data.expires ? $moment(slotProps.data.expires).format('MM/DD/YYYY HH:mm:ss') : '∞' }}
            </template>
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
                @click="removeGift(slotProps.data.id)"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <VeeForm v-slot="{ meta }">
          <SectionedDialog
            v-model:visible="giftDialog"
            v-model="section"
            :sections="sections"
            :header="$t('admin.gift_dialog')"
            width="620px"
            class="p-fluid"
          >
            <template #main>
              <VeeField
                v-model="gift.promocode"
                name="promocode"
                :label="$t('admin.promocode')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.promocode') }}<span class="p-error"> *</span></label>
                  <InputText
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @blur="handleBlur"
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field">
                <label>{{ $t('admin.expires') }}</label>
                <DatePicker id="time24" v-model="gift.expires" showTime showSeconds appendTo="body" />
              </div>
              <VeeField
                v-model="gift.max_activations"
                name="max_activations"
                :label="$t('admin.type')"
                rules="min:1"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.uses_count') }}</label>
                  <InputNumber
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @input="handleChange($event.value)"
                    @blur="handleBlur"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
            </template>

            <template #issuance>
              <VeeField
                v-model="gift.type"
                name="type"
                :label="$t('admin.type')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.type') }}<span class="p-error"> *</span></label>
                  <Select :modelValue="value" @update:modelValue="handleChange" :options="types" optionLabel="name" appendTo="body" />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field" v-if="['donate', 'permission'].find((v) => v == $_.get(gift.type, 'value'))">
                <label>{{ $t('cabinet.period') }}</label>
                <VeeField
                  v-model="gift.period"
                  name="period"
                  :label="$t('cabinet.period')"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange }"
                >
                  <Select :modelValue="value" @update:modelValue="handleChange" :options="periods" optionLabel="name" appendTo="body" />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </VeeField>
              </div>
              <div
                class="field"
                v-if="
                  ['donate', 'permission', 'product', 'kit', 'money'].find((v) => v == $_.get(gift.type, 'value')) &&
                  (!['permission'].find((v) => v == $_.get(gift.type, 'value')) ||
                    (gift.donate_permission && gift.donate_permission.type != 'web'))
                "
              >
                <label>{{ $t('cabinet.server') }}</label>
                <VeeField
                  v-model="gift.server"
                  name="server"
                  :label="$t('cabinet.server')"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange }"
                >
                  <Select :modelValue="value" @update:modelValue="handleChange" :options="servers" optionLabel="name" appendTo="body">
                    <template #option="slotProps">
                      <div class="flex align-items-center">
                        <IconAvatar :path="slotProps.option.icon" />
                        <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                      </div>
                    </template>
                  </Select>
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </VeeField>
              </div>
              <div class="field" v-if="$_.get(gift.type, 'value') == 'donate'">
                <label>{{ $t('cabinet.donate_group') }}</label>
                <VeeField
                  v-model="gift.donate_group"
                  name="donate_group"
                  :label="$t('cabinet.donate_group')"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange }"
                >
                  <Select :modelValue="value" @update:modelValue="handleChange" :options="donate_groups" optionLabel="name" appendTo="body">
                    <template #option="slotProps">
                      <div class="flex align-items-center">
                        <IconAvatar :path="slotProps.option.icon" />
                        <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                      </div>
                    </template>
                  </Select>
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </VeeField>
              </div>
              <div class="field" v-if="$_.get(gift.type, 'value') == 'permission'">
                <label>{{ $t('cabinet.donate_permission') }}</label>
                <VeeField
                  v-model="gift.donate_permission"
                  name="donate_permission"
                  :label="$t('cabinet.donate_permission')"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange }"
                >
                  <Select
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    :options="donate_permissions"
                    optionLabel="name"
                    appendTo="body"
                  >
                    <template #option="slotProps"> {{ slotProps.option.name }} (#{{ slotProps.option.id }}) </template>
                  </Select>
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </VeeField>
              </div>
              <div class="field" v-if="$_.get(gift.type, 'value') == 'product'">
                <label>{{ $t('cabinet.product') }}</label>
                <VeeField
                  v-model="gift.product"
                  name="product"
                  :label="$t('cabinet.product')"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange }"
                >
                  <AutoComplete
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    :suggestions="products"
                    @complete="searchProduct($event)"
                    optionLabel="name"
                    appendTo="body"
                  >
                    <template #option="slotProps">
                      <div class="flex align-items-center">
                        <IconAvatar :path="slotProps.option.icon" />
                        <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                      </div>
                    </template>
                  </AutoComplete>
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </VeeField>
              </div>
              <div class="field" v-if="$_.get(gift.type, 'value') == 'kit'">
                <label>{{ $t('store.kit') }}</label>
                <VeeField
                  v-model="gift.kit"
                  name="kit"
                  :label="$t('cabinet.product')"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange }"
                >
                  <AutoComplete
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    :suggestions="kits"
                    @complete="searchKit($event)"
                    optionLabel="name"
                    appendTo="body"
                  >
                    <template #option="slotProps">
                      <div class="flex align-items-center">
                        <IconAvatar :path="slotProps.option.icon" />
                        <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                      </div>
                    </template>
                  </AutoComplete>
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </VeeField>
              </div>
              <div class="field" v-if="['real', 'product', 'money'].find((v) => v == $_.get(gift.type, 'value'))">
                <VeeField
                  v-model="gift.amount"
                  name="amount"
                  :label="$t('admin.quantity')"
                  rules="required|min:1"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>{{ $t('admin.quantity') }}<span class="p-error"> *</span></label>
                    <InputNumber
                      :modelValue="value"
                      @update:modelValue="handleChange"
                      @input="handleChange($event.value)"
                      @blur="handleBlur"
                    />
                    <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  </div>
                </VeeField>
              </div>
            </template>

            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateGift() : createGift()"
              />
            </template>
          </SectionedDialog>
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
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_gifts')) })
  },
  data() {
    const access = useAccess({
      canCreate: Permission.EditorCabinetGiftsCreate,
      canUpdate: Permission.EditorCabinetGiftsUpdate,
      canDelete: Permission.EditorCabinetGiftsDelete,
      canDeleteMany: Permission.EditorCabinetGiftsDeleteMany,
    })

    return {
      ...access,
      gifts: null,
      loading: true,
      selected: null,
      updateMode: false,
      gift: {
        id: null,
        promocode: null,
        type: 'real',
        max_activations: null,
        expires: null,
        product: null,
        kit: null,
        donate_group: null,
        donate_permission: null,
        server: null,
        period: null,
        amount: null,
      },
      giftDialog: false,
      section: 'main',
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        servers: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
      servers: null,
      periods: null,
      products: null,
      donate_groups: null,
      donate_permissions: null,
      kits: null,
    }
  },
  computed: {
    sections() {
      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle' },
        { key: 'issuance', label: 'admin.section_issuance', icon: 'pi pi-gift' },
      ]
    },
    types() {
      return [
        { name: this.$t('admin.gift_type_real'), value: 'real' },
        { name: this.$t('admin.gift_type_money'), value: 'money' },
        { name: this.$t('cabinet.donate_group'), value: 'donate' },
        { name: this.$t('cabinet.donate_permission'), value: 'permission' },
        { name: this.$t('cabinet.product'), value: 'product' },
        { name: this.$t('store.kit'), value: 'kit' },
      ]
    },
  },

  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.giftDialog = false
      this.gifts = await this.$api.get('/cabinet/gifts').then((res) => res.data)
      this.donate_groups = await this.$api.get('/donates/groups').then((res) => res.data)
      this.donate_permissions = await this.$api.get('/donates/permissions').then((res) => res.data)
      this.periods = await this.$api.get('/donates/periods').then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)
      this.loading = false
    },
    async searchProduct(event) {
      this.products = await this.$api
        .get('/store/products', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    async searchKit(event) {
      this.kits = await this.$api
        .get('/store/kits', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    hideDialog() {
      this.giftDialog = false
    },
    async openDialog(gift = null) {
      this.updateMode = !!gift
      if (gift) {
        this.gift = this.$_.pick(await this.$api.get('/cabinet/gifts/' + gift.id).then((res) => res.data), this.$_.deepKeys(this.gift))
        this.gift.type = this.types.find((type) => type.value == this.gift.type)
        this.gift.donate_group = this.donate_groups.find((group) => group.id == this.gift.donate_group?.id)
        this.gift.donate_permission = this.donate_permissions.find((perm) => perm.id == this.gift.donate_permission?.id)
        if (this.gift.expires) this.gift.expires = this.$moment(this.gift.expires).toDate()
      } else {
        this.gift = {
          id: null,
          promocode: null,
          type: 'real',
          max_activations: null,
          expires: null,
          product: null,
          kit: null,
          donate_group: null,
          donate_permission: null,
          server: null,
          period: null,
          amount: null,
        }
      }
      this.giftDialog = true
    },
    async createGift() {
      this.loading = true
      try {
        await this.$api.post('/cabinet/gifts', {
          ...this.gift,
          type: this.gift.type.value,
          kit: this.gift.kit?.id,
          period: this.gift.period?.id,
          product: this.gift.product?.id,
          server: this.gift.server?.id,
          donate_group: this.gift.donate_group?.id,
          donate_permission: this.gift.donate_permission?.id,
        })
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.gift_created'),
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
    async updateGift() {
      this.loading = true
      try {
        await this.$api.patch('/cabinet/gifts/' + this.gift.id, {
          ...this.$_.omit(this.gift, 'id'),
          type: this.gift.type.value,
          kit: this.gift.kit?.id,
          product: this.gift.product?.id,
          period: this.gift.period?.id,
          server: this.gift.server?.id,
          donate_group: this.gift.donate_group?.id,
          donate_permission: this.gift.donate_permission?.id,
          expires: this.gift.expires,
        })
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.gift_updated'),
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
    async removeMany() {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.delete_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/cabinet/gifts/bulk', {
              data: {
                items: this.selected.map((gift) => gift.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.gifts_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async removeGift(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/cabinet/gifts/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.gift_deleted'),
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
