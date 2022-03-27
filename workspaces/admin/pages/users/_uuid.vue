<template>
  <div>
    <ValidationObserver v-slot="{ invalid }">
      <Dialog
        :visible.sync="giveProductDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        header="Выдача товара игроку"
        class="p-fluid"
      >
        <div class="field">
          <label>Сервер</label>
          <ValidationProvider name="Сервер" rules="required" v-slot="{ errors }">
            <Dropdown v-model="whItem.server" :options="servers" optionLabel="name" appendTo="body">
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
        <div class="field">
          <label>Товар</label>
          <ValidationProvider name="Товар" rules="required" v-slot="{ errors }">
            <AutoComplete v-model="whItem.product" :suggestions="products" @complete="searchProduct($event)" field="name" appendTo="body">
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
        <div class="field">
          <ValidationProvider name="Количество" rules="required|min:1" v-slot="{ errors }">
            <div class="field">
              <label>Количество</label>
              <InputNumber v-model="whItem.amount" />
              <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
            </div>
          </ValidationProvider>
        </div>
        <template #footer>
          <Button :disabled="wh_loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideProductDialog" />
          <Button :disabled="wh_loading || invalid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="giveProduct()" />
        </template>
      </Dialog>
    </ValidationObserver>

    <ValidationObserver v-slot="{ invalid }">
      <Dialog
        :visible.sync="giveKitDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        header="Выдача кита игроку"
        class="p-fluid"
      >
        <div class="field">
          <label>Сервер</label>
          <ValidationProvider name="Сервер" rules="required" v-slot="{ errors }">
            <Dropdown v-model="whItem.server" :options="servers" optionLabel="name" appendTo="body">
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
        <div class="field">
          <label>Кит</label>
          <ValidationProvider name="Кит" rules="required" v-slot="{ errors }">
            <AutoComplete v-model="whItem.kit" :suggestions="kits" @complete="searchKit($event)" field="name" appendTo="body">
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
        <template #footer>
          <Button :disabled="wh_loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideKitDialog" />
          <Button :disabled="wh_loading || invalid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="giveKit()" />
        </template>
      </Dialog>
    </ValidationObserver>

    <div class="grid">
      <div class="col-12 md:col-6">
        <div class="card p-fluid">
          <h4>Профиль</h4>
          <div class="field">
            <label>Имя пользователя</label>
            <InputText type="text" />
          </div>
          <div class="field">
            <label>Email</label>
            <InputText type="text" />
          </div>
          <div class="field">
            <label>UUID</label>
            <InputText type="text" readonly />
          </div>
          <h4>Роли и права</h4>
          <div class="field">
            <label>Роли</label>
            <InputText type="text" />
          </div>
          <div class="field">
            <label>Права</label>
            <InputText type="text" />
          </div>
          <h4>Сменить пароль</h4>
          <div class="field">
            <label>Пароль</label>
            <InputText type="text" />
          </div>
          <div class="field">
            <label>Подтверждение пароля</label>
            <InputText type="text" />
          </div>
        </div>
      </div>
      <div class="col-12 md:col-6">
        <div class="card p-fluid">
          <h4>Внешний вид</h4>
        </div>
        <div class="card p-fluid">
          <h4>Экономика</h4>
        </div>
        <div class="card p-fluid">
          <h4>Донат-группы</h4>
        </div>
        <div class="card p-fluid">
          <h4>Донат-права</h4>
        </div>
        <div class="card p-fluid">
          <h4>Блокировка</h4>
        </div>
      </div>
      <div class="col-12">
        <div class="card">
          <div class="flex align-items-center justify-content-between">
            <h4>Магазин и склад</h4>
            <Dropdown
              @change="warehouseFetch()"
              v-model="warehouse_server"
              :options="servers"
              optionLabel="name"
              appendTo="body"
              style="min-width: 150px"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                  <Avatar v-else icon="pi pi-image" shape="circle" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Dropdown>
          </div>
          <Button label="Выдать товар" class="p-button mr-2 mb-2" @click="showProductDialog()" />
          <Button label="Выдать кит" class="p-button mr-2 mb-2" @click="showKitDialog()" />
          <DataTable :value="warehouse" :loading="wh_loading" responsiveLayout="scroll" dataKey="id">
            <Column field="id" header="ID" :styles="{ width: '8rem' }" sortable></Column>
            <Column field="name" header="Название" sortable>
              <template #body="slotProps">
                <div class="flex align-items-center">
                  <Avatar
                    v-if="slotProps.data.product.icon"
                    :image="`${$config.apiUrl + '/' + slotProps.data.product.icon}`"
                    shape="circle"
                  />
                  <Avatar v-else icon="pi pi-image" shape="circle" />
                  <span class="ml-2">{{ slotProps.data.product.name }}</span>
                </div>
              </template>
            </Column>
            <Column field="price" header="Количество" sortable>
              <template #body="slotProps"> {{ slotProps.data.amount }} шт. </template>
            </Column>
            <Column field="categories" header="Категории" filterField="categories" :showFilterMatchModes="false">
              <template #body="slotProps">
                <Tag
                  class="mr-2 mb-2"
                  v-for="category in slotProps.data.product.categories"
                  :key="category.id"
                  :value="category.name"
                ></Tag>
              </template>
            </Column>
            <Column :styles="{ width: '4rem' }">
              <template #body="slotProps">
                <Button @click="removeWHItem(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
      <div class="col-12">
        <div class="card p-fluid">
          <h4>Статистика</h4>
        </div>
      </div>
      <div class="col-12">
        <div class="card p-fluid">
          <h4>История действий</h4>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      servers: [],
      products: null,
      kits: null,
      user: null,
      warehouse: [],
      warehouse_server: null,
      wh_loading: false,
      giveProductDialog: false,
      giveKitDialog: false,
      whItem: {
        amount: null,
        server: null,
        kit: null,
        product: null,
      },
    }
  },

  async fetch() {
    this.servers = await this.$axios.get('/servers').then((res) => res.data)
    this.user = await this.$axios.get('/users/' + this.$route.params.uuid).then((res) => res.data)

    if (this.servers.length) {
      this.warehouse_server = this.servers[0]
      this.warehouseFetch()
    }
  },

  methods: {
    async warehouseFetch() {
      this.wh_loading = true
      this.warehouse = await this.$axios.get(`/store/warehouse/admin/${this.user.uuid}/${this.warehouse_server.id}`).then((res) => res.data)
      this.wh_loading = false
    },

    async removeWHItem(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления товара со склада`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.wh_loading = true
          try {
            await this.$axios.delete(`/store/warehouse/admin/` + id).then((res) => res.data)
          } catch {}
          await this.warehouseFetch()
          this.wh_loading = false
        },
      })
    },
    showProductDialog() {
      this.whItem = {
        amount: null,
        server: null,
        kit: null,
        product: null,
      },
      this.giveProductDialog = true
    },
    hideProductDialog() {
      this.giveProductDialog = false
    },
    showKitDialog() {
      this.whItem = {
        amount: null,
        server: null,
        kit: null,
        product: null,
      },
      this.giveKitDialog = true
    },
    hideKitDialog() {
      this.giveKitDialog = false
    },
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
    async giveProduct() {
      this.wh_loading = true
      try {
        await this.$axios.post(`/store/cart/admin/give/product`, {
          amount: this.whItem.amount,
          server_id: this.whItem.server.id,
          product_id: this.whItem.product.id,
          user_uuid: this.user.uuid
        }).then((res) => res.data)
      } catch {}
      await this.warehouseFetch()
      this.wh_loading = false
      this.hideProductDialog()
    },
    async giveKit() {
      this.wh_loading = true
      try {
        await this.$axios.post(`/store/cart/admin/give/kit`, {
          server_id: this.whItem.server.id,
          kit_id: this.whItem.kit.id,
          user_uuid: this.user.uuid
        }).then((res) => res.data)
      } catch {}
      await this.warehouseFetch()
      this.wh_loading = false
      this.hideKitDialog()
    },
  },
}
</script>
