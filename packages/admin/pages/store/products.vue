<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template #start>
            <div class="my-2">
              <Button label="Создать" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
                icon="pi pi-pencil"
                class="p-button-second mr-2"
                :disabled="!selected || !selected.length"
                @click="openManyDialog()"
              />
              <Button icon="pi pi-trash" class="p-button-danger" :disabled="!selected || !selected.length" @click="removeMany()" />
            </div>
          </template>

          <!--template #end>
            <FileUpload
              mode="basic"
              accept="image/*"
              :maxFileSize="1000000"
              label="Import"
              chooseLabel="Импорт"
              class="mr-2 inline-block"
            />
            <Button label="Экспорт" icon="pi pi-upload" class="p-button-help" />
          </template-->
        </Toolbar>
        <DataTable
          :value="products.data"
          :loading="loading"
          :rows="products.meta.itemsPerPage"
          paginator
          :filters.sync="filters"
          :totalRecords="products.meta.totalItems"
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
              <h5 class="m-0">Управление товарами</h5>
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
                @click="removeProduct(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog :visible.sync="fileDialog" :style="{ width: '400px' }" :modal="true" header="Иконка товара" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <Avatar v-if="product.icon" :image="`${$config.apiUrl + '/' + product.icon}`" size="xlarge" shape="circle" />
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
            :visible.sync="productManyDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Массовое редактирование товаров"
            class="p-fluid"
          >
            <div class="field">
              <label>Серверы</label>
              <MultiSelect
                display="chip"
                :filter="true"
                v-model="productMany.servers"
                :options="servers"
                optionLabel="name"
                :placeholder="productMany.servers.length ? 'Выберите серверы' : 'Без изменений'"
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
                v-model="productMany.categories"
                :multiple="true"
                :suggestions="categories"
                @complete="searchCategory($event)"
                field="name"
                appendTo="body"
                :placeholder="productMany.categories.length ? 'Выберите катагории' : 'Без изменений'"
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
                <ValidationProvider name="Цена" rules="min:0.01" v-slot="{ errors }">
                  <div class="field">
                    <label>Цена</label>
                    <InputNumber v-model="productMany.price" placeholder="Без изменений" currency="RUB" locale="ru-RU" mode="currency" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
              <div class="col-6">
                <ValidationProvider name="Скидка" rules="min_value:0|max_value:99" v-slot="{ errors }">
                  <div class="field">
                    <label>Скидка</label>
                    <InputNumber suffix=" %" placeholder="Без изменений" :useGrouping="false" v-model="productMany.sale" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideManyDialog" />
              <Button :disabled="loading || invalid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="updateMany" />
            </template>
          </Dialog>
        </ValidationObserver>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="productDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование товара"
            class="p-fluid"
          >
            <ValidationProvider name="Название" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Название</label>
                <InputText v-model="product.name" autofocus />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="ID предмета" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>ID предмета</label>
                <InputText v-model="product.item_id" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field">
              <label>Описание</label>
              <Editor v-model="product.description" editorStyle="height: 160px">
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
              <label>Серверы</label>
              <MultiSelect
                display="chip"
                :filter="true"
                v-model="product.servers"
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
                v-model="product.categories"
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
                    <InputNumber v-model="product.price" currency="RUB" locale="ru-RU" mode="currency" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
              <div class="col-6">
                <ValidationProvider name="Скидка" rules="min_value:0|max_value:99" v-slot="{ errors }">
                  <div class="field">
                    <label>Скидка</label>
                    <InputNumber suffix=" %" :useGrouping="false" v-model="product.sale" />
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
                @click="updateMode ? updateProduct() : createProduct()"
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
    title: 'Товары',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      selected: null,
      categories: null,
      servers: null,
      serversFilterd: null,
      products: {
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
      product: {
        id: null,
        name: null,
        description: null,
        price: null,
        sale: null,
        servers: [],
        categories: [],
        icon: null,
        item_id: null,
      },
      productMany: {
        price: null,
        sale: null,
        servers: [],
        categories: [],
      },
      productManyDialog: false,
      fileDialog: false,
      productDialog: false,
      filters: {
        global: { value: null },
        servers: { value: null },
        categories: { value: null },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.products = await this.$axios
      .get('/store/products', {
        params: {
          page: this.products.meta.currentPage,
          limit: this.products.meta.itemsPerPage,
          sortBy: this.products.meta.sortBy,
          search: this.filters.global.value,
          ...this.filtersTansformer(this.filters),
        },
      })
      .then((res) => res.data)
    this.servers = await this.$axios.get('/servers').then((res) => res.data)

    this.productDialog = false
    this.productManyDialog = false
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
      this.products.meta.currentPage = event.page + 1
      this.products.meta.itemsPerPage = event.rows

      this.$fetch()
    },
    onSort(event) {
      this.products.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

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
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$axios.patch(`/store/products/icon/` + this.product.id, formData, {
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
        await this.$axios.delete(`/store/products/icon/` + this.product.id)
        this.$toast.add({
          severity: 'success',
          detail: 'Иконка успешно удалена',
          life: 3000,
        })
        await this.$fetch()
      } catch {}
    },
    hideDialog() {
      this.productDialog = false
    },
    hideManyDialog() {
      this.productManyDialog = false
    },
    async openDialog(product = null) {
      this.updateMode = !!product
      if (product) {
        this.product = this.$_.pick(product, this.$_.deepKeys(this.product))
      } else {
        this.product = {
          id: null,
          name: null,
          description: null,
          price: null,
          sale: null,
          item_id: null,
          servers: this.filters?.servers?.value || [],
          categories: this.filters?.categories?.value || [],
          icon: null,
        }
      }
      this.productDialog = true
    },
    async openManyDialog() {
      this.productMany = {
        price: null,
        sale: null,
        servers: [],
        categories: [],
      }
      this.productManyDialog = true
    },
    openFileDialog(product) {
      this.product = this.$_.pick(product, this.$_.deepKeys(this.product))
      this.fileDialog = true
    },
    async createProduct() {
      this.loading = true
      try {
        await this.$axios.post('/store/products', {
          ...this.product,
          servers: this.product.servers.map((server) => server.id),
          categories: this.product.categories.map((category) => category.id),
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Товар успешно добавлен',
          life: 3000,
        })
        await this.$fetch()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: 'Товар с данным ID уже присутствует',
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
    async updateProduct() {
      this.loading = true
      try {
        await this.$axios.patch(
          '/store/products/' + this.product.id,
          this.$_.omit(
            {
              ...this.product,
              servers: this.product.servers.map((server) => server.id),
              categories: this.product.categories.map((category) => category.id),
            },
            'id'
          )
        )
        this.$toast.add({
          severity: 'success',
          detail: 'Товар успешно редактирован',
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
    async removeProduct(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/store/products/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Товар успешно удален',
              life: 3000,
            })
          } catch {}
          await this.$fetch()
        },
      })
    },
    async updateMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Редактирование ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.patch('/store/products/bulk/', {
              products: this.selected.map((select) => {
                select = this.$_.pick(select, 'id')

                if (this.productMany.servers && this.productMany.servers.length)
                  select.servers = this.productMany.servers.map((server) => server.id)

                if (this.productMany.categories && this.productMany.categories.length)
                  select.categories = this.productMany.categories.map((category) => category.id)

                if (this.productMany.price) select.price = this.productMany.price

                if (this.productMany.sale || this.productMany.sale == 0) select.sale = this.productMany.sale

                return select
              }),
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Товары успешно редактированы',
              life: 3000,
            })
            await this.$fetch()
          } catch {
            this.loading = false
            this.$toast.add({
              severity: 'error',
              detail: 'Введены некоректные данные',
              life: 3000,
            })
          }
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
            await this.$axios.delete('/store/products/bulk/', {
              data: {
                items: this.selected.map((category) => category.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Товары успешно удалены',
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
