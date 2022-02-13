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
              <MultiSelect
                display="chip"
                :filter="true"
                v-model="filterModel.value"
                :options="servers"
                optionLabel="name"
                placeholder="Выберите серверы"
                class="p-column-filter"
              >
                <template #option="slotProps">
                  <div class="p-multiselect-representative-option">
                    <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </MultiSelect>
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
              <Button @click="addKitItem" icon="pi pi-plus" class="p-button-rounded p-button-text" />
              <DataTable
                :value="kit.items"
                editMode="row"
                :editingRows.sync="kitItems"
                @row-edit-save="onKitItemEditSave"
                responsiveLayout="scroll"
              >
                <Column field="product" header="Товар из магазина" :styles="{ width: '40%' }">
                  <template #body="slotProps">
                    <div class="flex align-items-center">
                      <Avatar v-if="$_.get(slotProps.data, 'product.icon')" :image="`${$config.apiUrl + '/' + $_.get(slotProps.data, 'product.icon')}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ $_.get(slotProps.data, 'product.name', 'Не выбран') }}</span>
                    </div>
                  </template>
                  <template #editor="slotProps">
                    <AutoComplete
                      v-model="slotProps.data[slotProps.column.field]"
                      :suggestions="products"
                      @complete="searchProduct($event)"
                      field="name"
                      appendTo="body"
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
                <Column field="amount" header="Количество" :styles="{ width: '50%' }">
                  <template #editor="slotProps">
                    <InputNumber placehol v-model="slotProps.data[slotProps.column.field]" />
                  </template>
                </Column>
                <Column :rowEditor="true" :styles="{ width: '10%', 'min-width': '8rem' }" :bodyStyle="{ 'text-align': 'right' }"></Column>
                <Column v-if="!kitItems || !kitItems.length" :styles="{ width: '3rem' }" :bodyStyle="{ 'text-align': 'center' }">
                  <template #body="slotProps">
                    <Button
                      @click="removeKitItem(slotProps.index)"
                      icon="pi pi-trash"
                      class="p-button-rounded p-button-text p-button-danger"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
            <div class="field">
              <label>Серверы</label>
              <MultiSelect
                display="chip"
                :filter="true"
                v-model="kit.servers"
                :options="servers"
                optionLabel="name"
                placeholder="Выберите серверы"
                class="p-column-filter"
              >
                <template #option="slotProps">
                  <div class="p-multiselect-representative-option">
                    <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </MultiSelect>
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
        items: [],
        icon: null,
      },
      fileDialog: false,
      kitDialog: false,
      filters: {
        global: { value: null },
        servers: { value: null },
        categories: { value: null },
      },
      kitItems: null,
    }
  },
  async fetch() {
    this.loading = true
    this.kits = await this.$axios
      .get('/store/kits', {
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
    onKitItemEditSave(event) {
      let { newData, index } = event
      this.kit.items[index] = newData
    },
    addKitItem() {
      this.kit.items.push({
        amount: null,
        product: null,
      })
    },
    removeKitItem(index) {
      this.kit.items.splice(index, 1)
      this.kitItems = []
    },
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
        .get('/store/categories', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
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
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$axios.patch(`/store/kits/icon/` + this.kit.id, formData, {
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
        this.fileDialog = false
        this.$toast.add({
          severity: 'error',
          detail: 'Поддерживаются только изображения',
          life: 3000,
        })
      }
    },
    async removeIcon() {
      try {
        await this.$axios.delete(`/store/kits/icon/` + this.kit.id)
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
      this.kitItems = []
    },
    async openDialog(kit = null) {
      this.updateMode = !!kit
      if (kit) {
        this.kit = this.$_.pick(await this.$axios.get('/store/kits/' + kit.id).then((res) => res.data), this.$_.deepKeys(this.kit))
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
          items: [],
        }
      }
      this.kitDialog = true
    },
    async openFileDialog(kit) {
      this.kit = this.$_.pick(await this.$axios.get('/store/kits/' + kit.id).then((res) => res.data), this.$_.deepKeys(this.kit))
      this.fileDialog = true
    },
    async createKit() {
      this.loading = true
      try {
        await this.$axios.post('/store/kits', {
          ...this.kit,
          servers: this.kit.servers.map((server) => server.id),
          items: this.kit.items.map((item) => ({ product_id: item.product.id, amount: item.amount })),
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
          '/store/kits/' + this.kit.id,
          this.$_.omit(
            {
              ...this.kit,
              servers: this.kit.servers.map((server) => server.id),
              items: this.kit.items.map((item) => ({ product_id: item.product.id, amount: item.amount })),
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
            await this.$axios.delete('/store/kits/' + id)
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
            await this.$axios.delete('/store/kits/bulk/', {
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
