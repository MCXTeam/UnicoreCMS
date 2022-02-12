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
          :value="categories.data"
          :loading="loading"
          :rows="categories.meta.itemsPerPage"
          paginator
          :filters.sync="filters"
          :totalRecords="categories.meta.totalItems"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          :selection.sync="selected"
          rowHover
          lazy
          responsiveLayout="scroll"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление категориями</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :styles="{ width: '3rem' }"></Column>
          <Column sortable field="id" header="ID" :styles="{ width: '8rem' }"></Column>
          <Column sortable field="name" header="Название">
            <template #body="slotProps">
              <div class="flex align-items-center">
                <Avatar v-if="slotProps.data.icon" :image="`${$config.apiUrl + '/' + slotProps.data.icon}`" shape="circle" />
                <Avatar v-else icon="pi pi-image" shape="circle" />
                <span class="ml-2">{{ slotProps.data.name }}</span>
              </div>
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button
                @click="removeCategory(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog :visible.sync="fileDialog" :style="{ width: '400px' }" :modal="true" header="Иконка категории" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <Avatar v-if="category.icon" :image="`${$config.apiUrl + '/' + category.icon}`" size="xlarge" shape="circle" />
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
            :visible.sync="categoryDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            header="Создание/редактирование Категории"
            class="p-fluid"
          >
            <ValidationProvider name="Название" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Название</label>
                <InputText v-model="category.name" autofocus />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field">
              <label>Описание</label>
              <Editor v-model="category.description" editorStyle="height: 220px">
                <template #toolbar>
                  <span class="ql-formats">
                    <button class="ql-bold"></button>
                    <button class="ql-italic"></button>
                    <button class="ql-underline"></button>
                  </span>
                </template>
              </Editor>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateCategory() : createCategory()"
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
import { FilterMatchMode } from 'primevue/api'
import { ValidationObserver, ValidationProvider } from 'vee-validate'

export default {
  head: {
    title: 'Категории',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      categories: {
        data: null,
        meta: {
          itemsPerPage: 20,
          totalItems: 0,
          currentPage: 1,
          totalPages: 1,
          sortBy: null,
        },
      },
      loading: true,
      updateMode: false,
      selected: null,
      category: {
        id: null,
        name: null,
        description: null,
        icon: null,
      },
      fileDialog: false,
      categoryDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    console.log(this.categories.meta.itemsPerPage)
    this.loading = true
    this.selected = null
    this.categories = await this.$axios
      .get('/admin/store/categories', {
        params: {
          page: this.categories.meta.currentPage,
          limit: this.categories.meta.itemsPerPage,
          sortBy: this.categories.meta.sortBy,
          search: this.filters.global.value,
        },
      })
      .then((res) => res.data)

    this.categoryDialog = false
    this.fileDialog = false
    this.loading = false
    this.selected = null
  },
  methods: {
    onPage(event) {
      this.categories.meta.currentPage = event.page + 1
      this.categories.meta.itemsPerPage = event.rows

      this.$fetch()
    },
    onSort(event) {
      this.categories.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

      this.$fetch()
    },
    onFilter() {
      this.$fetch()
    },
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$axios.patch(`/admin/store/categories/icon/` + this.category.id, formData, {
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
        await this.$axios.delete(`/admin/store/categories/icon/` + this.category.id)
        this.$toast.add({
          severity: 'success',
          detail: 'Иконка успешно удалена',
          life: 3000,
        })
        await this.$fetch()
      } catch {}
    },
    hideDialog() {
      this.categoryDialog = false
    },
    openDialog(category = null) {
      this.updateMode = !!category
      if (category) {
        this.category = this.$_.pick(category, this.$_.deepKeys(this.category))
      } else {
        this.category = {
          id: null,
          name: null,
          description: null,
          icon: null,
        }
      }
      this.categoryDialog = true
    },
    openFileDialog(category) {
      this.category = this.$_.pick(category, this.$_.deepKeys(this.category))
      this.fileDialog = true
    },
    async createCategory() {
      this.loading = true
      try {
        await this.$axios.post('/admin/store/categories', this.category)
        this.$toast.add({
          severity: 'success',
          detail: 'Категория успешно добавлена',
          life: 3000,
        })
        await this.$fetch()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: 'Категория с данным ID уже присутствует',
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
    async updateCategory() {
      this.loading = true
      try {
        await this.$axios.patch('/admin/store/categories/' + this.category.id, this.$_.omit(this.category, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Категория успешно редактирована',
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
    async removeCategory(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/admin/store/categories/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Категория успешно удалена',
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
            await this.$axios.delete('admin/store/categories/bulk/', {
              data: {
                items: this.selected.map((category) => category.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Категории успешно удалены',
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
