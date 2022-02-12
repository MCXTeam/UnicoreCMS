<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template #start>
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
          :value="kits.data"
          :loading="loading"
          :rows="kits.meta.itemsPerPage"
          paginator
          :filters.sync="filters"
          :totalRecords="kits.meta.totalItems"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          @filter="onFilter"
          :selection.sync="selected"
          rowHover
          lazy
          responsiveLayout="scroll"
          dataKey="id"
          filterDisplay="menu"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление китами</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :styles="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :styles="{ width: '8rem' }" sortable></Column>
          <Column field="name" header="Название" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center">
                <Avatar v-if="slotProps.data.icon" :image="`${$config.apiUrl + '/' + slotProps.data.icon}`" shape="circle" />
                <Avatar v-else icon="pi pi-image" shape="circle" />
                <span class="ml-2">{{ slotProps.data.name }}</span>
              </div>
            </template>
          </Column>
          <Column field="price" header="Цена" sortable>
            <template #body="slotProps">
              {{ formatCurrency(slotProps.data.price) }}
            </template>
          </Column>
          <Column field="sale" header="Скидка" sortable></Column>
          <Column field="servers" header="Серверы" filterField="servers" :showFilterMatchModes="false">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-for="server in slotProps.data.servers" :key="server.id" :value="server.name"></Tag>
            </template>
            <template #filter="{ filterModel }">
              <div class="mb-3 font-bold">Серверы</div>
              <AutoComplete
                v-model="filterModel.value"
                :multiple="true"
                :suggestions="serversFilterd"
                @complete="searchServer($event)"
                field="name"
                placeholder="Выберите серверы"
                style="max-width: 200px"
              >
                <template #item="slotProps">
                  <div class="flex align-items-center">
                    <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </template>
          </Column>
          <Column field="categories" header="Категории" filterField="categories" :showFilterMatchModes="false">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-for="category in slotProps.data.categories" :key="category.id" :value="category.name"></Tag>
            </template>
            <template #filter="{ filterModel }">
              <div class="mb-3 font-bold">Категории</div>
              <AutoComplete
                v-model="filterModel.value"
                :multiple="true"
                :suggestions="categories"
                @complete="searchCategory($event)"
                field="name"
                placeholder="Выберите категории"
                style="max-width: 200px"
              >
                <template #item="slotProps">
                  <div class="flex align-items-center">
                    <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button
                @click="removeKit(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog :visible.sync="fileDialog" :style="{ width: '400px' }" :modal="true" header="Иконка кита" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <Avatar v-if="kit.icon" :image="`${$config.apiUrl + '/' + kit.icon}`" size="xlarge" shape="circle" />
            <Avatar v-else icon="pi pi-image" size="xlarge" shape="circle" />
            <div class="field ml-6 mb-0">
              <Button label="Загрузить" icon="pi pi-upload" @click="$refs.fileInput.choose()" />
              <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeIcon()" />
              <FileUpload
                ref="fileInput"
                style="display: none"
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

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="kitDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование кита"
            class="p-fluid"
          >
            <ValidationProvider name="Название" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Название</label>
                <InputText v-model="kit.name" autofocus />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field">
              <label>Описание</label>
              <Editor v-model="kit.description" editorStyle="height: 160px">
                <template #toolbar>
                  <span class="ql-formats">
                    <button class="ql-bold"></button>
                    <button class="ql-italic"></button>
                    <button class="ql-underline"></button>
                  </span>
                </template>
              </Editor>
            </div>
            <div class="field">
              <label>Товары</label>
              <AutoComplete
                v-model="kit.products"
                :multiple="true"
                :suggestions="products"
                @complete="searchProduct($event)"
                field="name"
                appendTo="body"
                placeholder="Выберите товары"
              >
                <template #item="slotProps">
                  <div class="flex align-items-center">
                    <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </div>
            <div class="field">
              <label>Серверы</label>
              <AutoComplete
                v-model="kit.servers"
                :multiple="true"
                :suggestions="serversFilterd"
                @complete="searchServer($event)"
                field="name"
                appendTo="body"
                placeholder="Выберите серверы"
              >
                <template #item="slotProps">
                  <div class="flex align-items-center">
                    <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </div>
            <div class="field">
              <label>Категории</label>
              <AutoComplete
                v-model="kit.categories"
                :multiple="true"
                :suggestions="categories"
                @complete="searchCategory($event)"
                field="name"
                appendTo="body"
                placeholder="Выберите катагории"
              >
                <template #item="slotProps">
                  <div class="flex align-items-center">
                    <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </div>
            <div class="grid">
              <div class="col-6">
                <ValidationProvider name="Цена" rules="required|min:0.01" v-slot="{ errors }">
                  <div class="field">
                    <label>Цена</label>
                    <InputNumber v-model="kit.price" currency="RUB" locale="ru-RU" mode="currency" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
              <div class="col-6">
                <ValidationProvider name="Скидка" rules="min_value:0|max_value:99" v-slot="{ errors }">
                  <div class="field">
                    <label>Скидка</label>
                    <InputNumber suffix=" %" :useGrouping="false" v-model="kit.sale" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateKit() : createKit()"
              />
            </template>
          </Dialog>
        </ValidationObserver>
      </div>
    </div>
  </div>
</template>

<script>
import { sortTransform } from '~/helpers'
import { ValidationObserver, ValidationProvider } from 'vee-validate'

export default {
  head: {
    title: 'Киты',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      selected: null,
      categories: null,
      products: null,
      servers: null,
      serversFilterd: null,
      kits: {
        data: null,
        meta: {
          id: null,
          name: null,
          description: null,
          icon: null,
        },
      },
      loading: true,
      updateMode: false,
      kit: {
        id: null,
        name: null,
        description: null,
        price: null,
        sale: null,
        servers: [],
        categories: [],
        products: [],
        icon: null,
      },
      fileDialog: false,
      kitDialog: false,
      filters: {
        global: { value: null },
        servers: { value: null },
        categories: { value: null },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.kits = await this.$axios
      .get('/admin/store/kits', {
        params: {
          page: this.kits.meta.currentPage,
          limit: this.kits.meta.itemsPerPage,
          sortBy: this.kits.meta.sortBy,
          search: this.filters.global.value,
          ...this.filtersTansformer(this.filters),
        },
      })
      .then((res) => res.data)
    this.servers = await this.$axios.get('/servers').then((res) => res.data)

    this.kitDialog = false
    this.fileDialog = false
    this.loading = false
    this.selected = null
  },
  methods: {
    filtersTansformer(filters) {
      const transformed = {}

      if (filters.servers.value) transformed['filter.servers'] = filters.servers.value.map((server) => server.id).join(',')

      if (filters.categories.value) transformed['filter.categories'] = filters.categories.value.map((category) => category.id).join(',')

      return transformed
    },
    formatCurrency(value) {
      if (value) return value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })
      return
    },
    onPage(event) {
      this.kits.meta.currentPage = event.page + 1
      this.kits.meta.itemsPerPage = event.rows

      this.$fetch()
    },
    onSort(event) {
      this.kits.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

      this.$fetch()
    },
    onFilter() {
      this.$fetch()
    },
    async searchCategory(event) {
      this.categories = await this.$axios
        .get('/admin/store/categories', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    async searchProduct(event) {
      this.products = await this.$axios
        .get('/admin/store/products', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    searchServer(event) {
      if (!event.query.trim().length) {
        this.serversFilterd = this.servers
      } else {
        this.serversFilterd = this.servers.filter((server) => {
          if (server.name.toLowerCase().includes(event.query.toLowerCase())) return server
        })
      }
    },
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$axios.patch(`/admin/store/kits/icon/` + this.kit.id, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Иконка успешно обновлена',
          life: 3000,
        })
        await this.$fetch()
      } catch {
        this.$toast.add({
          severity: 'error',
          detail: 'Поддерживаются только изображения',
          life: 3000,
        })
      }
    },
    async removeIcon() {
      try {
        await this.$axios.delete(`/admin/store/kits/icon/` + this.kit.id)
        this.$toast.add({
          severity: 'success',
          detail: 'Иконка успешно удалена',
          life: 3000,
        })
        await this.$fetch()
      } catch {}
    },
    hideDialog() {
      this.kitDialog = false
    },
    async openDialog(kit = null) {
      this.updateMode = !!kit
      if (kit) {
        this.kit = this.$_.pick(await this.$axios.get('/admin/store/kits/' + kit.id).then((res) => res.data), this.$_.deepKeys(this.kit))
      } else {
        this.kit = {
          id: null,
          name: null,
          description: null,
          price: null,
          sale: null,
          item_id: null,
          servers: this.filters?.servers?.value || [],
          categories: this.filters?.categories?.value || [],
          products: [],
        }
      }
      this.kitDialog = true
    },
    openFileDialog(kit) {
      this.kit = this.$_.pick(kit, this.$_.deepKeys(this.kit))
      this.fileDialog = true
    },
    async createKit() {
      this.loading = true
      try {
        await this.$axios.post('/admin/store/kits', {
          ...this.kit,
          servers: this.kit.servers.map((server) => server.id),
          products: this.kit.products.map((product) => product.id),
          categories: this.kit.categories.map((category) => category.id),
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Кит успешно добавлен',
          life: 3000,
        })
        await this.$fetch()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: 'Кит с данным ID уже присутствует',
            life: 3000,
          })
        } else {
          this.$toast.add({
            severity: 'error',
            detail: 'Введены некоректные данные',
            life: 3000,
          })
        }
      }
    },
    async updateKit() {
      this.loading = true
      try {
        await this.$axios.patch(
          '/admin/store/kits/' + this.kit.id,
          this.$_.omit(
            {
              ...this.kit,
              servers: this.kit.servers.map((server) => server.id),
              products: this.kit.products.map((product) => product.id),
              categories: this.kit.categories.map((category) => category.id),
            },
            'id'
          )
        )
        this.$toast.add({
          severity: 'success',
          detail: 'Кит успешно редактирован',
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
    async removeKit(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/admin/store/kits/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Кит успешно удален',
              life: 3000,
            })
          } catch {}
          await this.$fetch()
        },
      })
    },
    async removeMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('admin/store/kits/bulk/', {
              data: {
                items: this.selected.map((category) => category.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Киты успешно удалены',
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
