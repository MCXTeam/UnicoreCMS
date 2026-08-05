<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button label="Создать" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
                label="Удалить"
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
              <h5 class="m-0">Управление промо-кодами</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :styles="{ width: '3rem' }"></Column>
          <Column sortable field="id" header="ID" :styles="{ width: '8rem' }"></Column>
          <Column field="promocode" header="Промо-код" sortable></Column>
          <Column field="type" header="Тип" sortable>
            <template #body="slotProps">
              {{ types.find((type) => type.value == slotProps.data.type).name }}
            </template>
          </Column>
          <Column field="type" header="Использований" sortable>
            <template #body="slotProps">
              {{
                slotProps.data.max_activations
                  ? `${slotProps.data.activations}/${slotProps.data.max_activations}`
                  : `${slotProps.data.activations}/∞`
              }}
            </template>
          </Column>
          <Column field="type" header="Активен до" sortable>
            <template #body="slotProps">
              {{ slotProps.data.expires ? $moment(slotProps.data.expires).format('MM/DD/YYYY HH:mm:ss') : '∞' }}
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removeGift(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="giftDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование промо-кода"
            class="p-fluid"
          >
            <VeeField
              v-model="gift.promocode"
              name="promocode"
              label="Промо-код"
              rules="required"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>Промо-код</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" :class="errorMessage && 'p-invalid'" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <div class="field">
              <label>Истекает</label>
              <DatePicker id="time24" v-model="gift.expires" showTime showSeconds appendTo="body" />
            </div>
            <VeeField
              v-model="gift.max_activations"
              name="max_activations"
              label="Тип"
              rules="min:1"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>Количество использований</label>
                <InputNumber :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField v-model="gift.type" name="type" label="Тип" rules="required" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Тип</label>
                <Select :modelValue="value" @update:modelValue="handleChange" :options="types" optionLabel="name" appendTo="body" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <div class="field" v-if="['donate', 'permission'].find((v) => v == $_.get(gift.type, 'value'))">
              <label>Период</label>
              <VeeField v-model="gift.period" name="period" label="Период" rules="required" v-slot="{ value, errorMessage, handleChange }">
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
              <label>Сервер</label>
              <VeeField v-model="gift.server" name="server" label="Сервер" rules="required" v-slot="{ value, errorMessage, handleChange }">
                <Select :modelValue="value" @update:modelValue="handleChange" :options="servers" optionLabel="name" appendTo="body">
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </Select>
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </VeeField>
            </div>
            <div class="field" v-if="$_.get(gift.type, 'value') == 'donate'">
              <label>Донат-группа</label>
              <VeeField
                v-model="gift.donate_group"
                name="donate_group"
                label="Донат-группа"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <Select :modelValue="value" @update:modelValue="handleChange" :options="donate_groups" optionLabel="name" appendTo="body">
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </Select>
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </VeeField>
            </div>
            <div class="field" v-if="$_.get(gift.type, 'value') == 'permission'">
              <label>Донат-право</label>
              <VeeField
                v-model="gift.donate_permission"
                name="donate_permission"
                label="Донат-право"
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
              <label>Товар</label>
              <VeeField v-model="gift.product" name="product" label="Товар" rules="required" v-slot="{ value, errorMessage, handleChange }">
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
                      <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </AutoComplete>
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </VeeField>
            </div>
            <div class="field" v-if="$_.get(gift.type, 'value') == 'kit'">
              <label>Кит</label>
              <VeeField v-model="gift.kit" name="kit" label="Товар" rules="required" v-slot="{ value, errorMessage, handleChange }">
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
                      <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
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
                label="Количество"
                rules="required|min:1"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>Количество</label>
                  <InputNumber :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateGift() : createGift()"
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
    const rc = useRuntimeConfig()
    useHead({ title: 'Гифт-коды' })
    return { apiUrl: rc.public.apiBaseurl }
  },
  data() {
    return {
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
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        servers: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
      types: [
        { name: 'Реальные деньги', value: 'real' },
        { name: 'Игровые деньги', value: 'money' },
        { name: 'Донат-группа', value: 'donate' },
        { name: 'Донат-право', value: 'permission' },
        { name: 'Товар', value: 'product' },
        { name: 'Кит', value: 'kit' },
      ],
      servers: null,
      periods: null,
      products: null,
      donate_groups: null,
      donate_permissions: null,
      kits: null,
    }
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
          detail: 'Гифт-код успешно добавлен',
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
          detail: 'Промо-код успешно редактирован',
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
    async removeMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/cabinet/gifts/bulk/', {
              data: {
                items: this.selected.map((gift) => gift.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Права успешно удалены',
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
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/cabinet/gifts/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Промо-код успешно удален',
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
