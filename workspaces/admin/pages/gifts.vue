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
          :filters.sync="filters"
          rowHover
          responsiveLayout="scroll"
          :selection.sync="selected"
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
              {{ slotProps.data.max_activations ? `${slotProps.data.activations}/${slotProps.data.max_activations}` : `${slotProps.data.activations}/∞` }}
            </template>
          </Column>
          <Column field="type" header="Активен до" sortable>
            <template #body="slotProps">
              {{ slotProps.data.expires ? $moment(slotProps.data.expires).local().format('MM/DD/YYYY HH:mm:ss') : '∞' }}
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removeGift(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="giftDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование промо-кода"
            class="p-fluid"
          >
            <ValidationProvider name="Промо-код" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Промо-код</label>
                <InputText v-model="gift.promocode" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field">
              <label>Истекает</label>
              <Calendar id="time24" v-model="gift.expires" showTime showSeconds appendTo="body" />
            </div>
            <ValidationProvider name="Тип" rules="min:1" v-slot="{ errors }">
              <div class="field">
                <label>Количество использований</label>
                <InputNumber v-model="gift.max_activations" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Тип" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Тип</label>
                <Dropdown v-model="gift.type" :options="types" optionLabel="name" appendTo="body" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field" v-if="['donate', 'permission'].find((v) => v == $_.get(gift.type, 'value'))">
              <label>Период</label>
              <ValidationProvider name="Период" rules="required" v-slot="{ errors }">
                <Dropdown v-model="gift.period" :options="periods" optionLabel="name" appendTo="body" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </ValidationProvider>
            </div>
            <div class="field" v-if="['donate', 'permission', 'product', 'kit', 'money'].find((v) => v == $_.get(gift.type, 'value')) && (gift.donate_permission && gift.donate_permission.type != 'web')">
              <label>Сервер</label>
              <ValidationProvider name="Сервер" rules="required" v-slot="{ errors }">
                <Dropdown v-model="gift.server" :options="servers" optionLabel="name" appendTo="body">
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </Dropdown>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </ValidationProvider>
            </div>
            <div class="field" v-if="$_.get(gift.type, 'value') == 'donate'">
              <label>Донат-группа</label>
              <ValidationProvider name="Донат-группа" rules="required" v-slot="{ errors }">
                <Dropdown v-model="gift.donate_group" :options="donate_groups" optionLabel="name" appendTo="body">
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </Dropdown>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </ValidationProvider>
            </div>
            <div class="field" v-if="$_.get(gift.type, 'value') == 'permission'">
              <label>Донат-право</label>
              <ValidationProvider name="Донат-право" rules="required" v-slot="{ errors }">
                <Dropdown v-model="gift.donate_permission" :options="donate_permissions" optionLabel="name" appendTo="body">
                  <template #option="slotProps"> {{ slotProps.option.name }} (#{{ slotProps.option.id }}) </template>
                </Dropdown>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </ValidationProvider>
            </div>
            <div class="field" v-if="$_.get(gift.type, 'value') == 'product'">
              <label>Товар</label>
              <ValidationProvider name="Товар" rules="required" v-slot="{ errors }">
                <AutoComplete v-model="gift.product" :suggestions="products" @complete="searchProduct($event)" field="name" appendTo="body">
                  <template #item="slotProps">
                    <div class="flex align-items-center">
                      <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                    </div>
                  </template>
                </AutoComplete>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </ValidationProvider>
            </div>
            <div class="field" v-if="$_.get(gift.type, 'value') == 'kit'">
              <label>Кит</label>
              <ValidationProvider name="Товар" rules="required" v-slot="{ errors }">
                <AutoComplete v-model="gift.kit" :suggestions="kits" @complete="searchKit($event)" field="name" appendTo="body">
                  <template #item="slotProps">
                    <div class="flex align-items-center">
                      <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                    </div>
                  </template>
                </AutoComplete>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </ValidationProvider>
            </div>
            <div class="field" v-if="['real', 'product', 'money'].find((v) => v == $_.get(gift.type, 'value'))">
              <ValidationProvider name="Количество" rules="required|min:1" v-slot="{ errors }">
                <div class="field">
                  <label>Количество</label>
                  <InputNumber v-model="gift.amount" />
                  <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                </div>
              </ValidationProvider>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateGift() : createGift()"
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
    title: 'Гифт-коды',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
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
  async fetch() {
    this.loading = true
    this.giftDialog = false
    this.gifts = await this.$axios.get('/cabinet/gifts').then((res) => res.data)
    this.donate_groups = await this.$axios.get('/donates/groups').then((res) => res.data)
    this.donate_permissions = await this.$axios.get('/donates/permissions').then((res) => res.data)
    this.periods = await this.$axios.get('/donates/periods').then((res) => res.data)
    this.servers = await this.$axios.get('/servers').then((res) => res.data)
    this.loading = false
  },
  methods: {
    async searchProduct(event) {
      this.products = await this.$axios
        .get('/store/products', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    async searchKit(event) {
      this.kits = await this.$axios
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
        this.gift = this.$_.pick(await this.$axios.get('/cabinet/gifts/' + gift.id).then((res) => res.data), this.$_.deepKeys(this.gift))
        this.gift.type = this.types.find((type) => type.value == this.gift.type)
        this.gift.donate_group = this.donate_groups.find((group) => group.id == this.gift.donate_group?.id)
        this.gift.donate_permission = this.donate_permissions.find((perm) => perm.id == this.gift.donate_permission?.id)
        if (this.gift.expires) this.gift.expires = this.$moment(this.gift.expires).local().toDate()
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
        await this.$axios.post('/cabinet/gifts', {
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
    async updateGift() {
      this.loading = true
      try {
        await this.$axios.patch('/cabinet/gifts/' + this.gift.id, {
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
    async removeMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/cabinet/gifts/bulk/', {
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
          await this.$fetch()
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
            await this.$axios.delete('/cabinet/gifts/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Промо-код успешно удален',
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
