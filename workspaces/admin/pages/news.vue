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
          :value="news.data"
          lazy
          paginator
          :rows="news.meta.itemsPerPage"
          :filters.sync="filters"
          dataKey="id"
          :totalRecords="news.meta.totalItems"
          :loading="loading"
          :rowsPerPageOptions="[20, 50, 100]"
          @page="onPage($event)"
          @sort="onSort($event)"
          :selection.sync="selected"
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление новостями</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :styles="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :styles="{ width: '8rem' }" sortable></Column>
          <Column field="title" header="Название" sortable />
          <Column field="created" header="Дата создания" sortable>
            <template #body="slotProps">
              {{ $moment(slotProps.data.created).local().format('D MMMM YYYY, HH:mm') }}
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button
                @click="removeNewsSingle(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>
        <Dialog :visible.sync="fileDialog" :style="{ width: '500px' }" :modal="true" header="Картинка новости" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <div class="grid mb-4 pt-2">
              <div class="col-12 md:col-6">
                <Avatar v-if="!newsSingle.image" icon="pi pi-image" size="xlarge" />
                <ImagePreview v-else width="200" :src="`${$config.apiUrl + '/' + newsSingle.image}`" preview />
              </div>
              <div class="col-12 md:col-6">
                <div class="field mb-0">
                  <Button label="Загрузить" icon="pi pi-upload" @click="$refs.fileInput.choose()" />
                  <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeImage()" />
                  <FileUpload
                    ref="fileInput"
                    style="display: none"
                    mode="basic"
                    name="file"
                    accept="image/*"
                    :auto="true"
                    :customUpload="true"
                    @uploader="uploadImage"
                  />
                </div>
              </div>
            </div>
          </div>
        </Dialog>
        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="newsSingleDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование новости"
            class="p-fluid"
          >
            <ValidationProvider name="Название" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Название</label>
                <InputText v-model="newsSingle.title" autofocus />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Содержимое" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Содержимое</label>
                <Editor v-model="newsSingle.description" editorStyle="height: 220px">
                  <template #toolbar>
                    <span class="ql-formats">
                      <button class="ql-bold"></button>
                      <button class="ql-italic"></button>
                      <button class="ql-underline"></button>
                    </span>
                  </template>
                </Editor>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div v-if="!updateMode">
              <FileUpload ref="fileInputSecond" :showUploadButton="false" name="file" accept="image/*">
                <template #empty>
                  <p>Выберать изображение</p>
                </template>
              </FileUpload>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateNewsSingle() : createNewsSingle()"
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
    title: 'Новости',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      news: {
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
      newsSingle: {
        id: null,
        title: null,
        description: null,
        image: null,
        link: null,
      },
      selected: null,
      newsSingleDialog: false,
      fileDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.selected = null
    this.news = await this.$axios
      .get('/news', {
        params: {
          page: this.news.meta.currentPage,
          limit: this.news.meta.itemsPerPage,
          search: this.filters.global.value,
          sortBy: this.news.meta.sortBy,
        },
      })
      .then((res) => res.data)
    this.newsSingleDialog = false
    this.fileDialog = false
    this.loading = false
  },
  methods: {
    async uploadImage(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$axios.patch(`/news/image/` + this.newsSingle.id, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Картинка успешно обновлена',
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
    async removeImage() {
      try {
        await this.$axios.delete(`/news/image/` + this.newsSingle.id)
        this.$toast.add({
          severity: 'success',
          detail: 'Картинка успешно удалена',
          life: 3000,
        })
        await this.$fetch()
      } catch {}
    },
    hideDialog() {
      this.newsSingleDialog = false
    },
    openDialog(newsSingle = null) {
      this.updateMode = !!newsSingle
      if (newsSingle) {
        this.newsSingle = this.$_.pick(newsSingle, this.$_.deepKeys(this.newsSingle))
      } else {
        this.newsSingle = {
          id: null,
          title: null,
          description: null,
          image: null,
          link: null,
        }
      }
      this.newsSingleDialog = true
    },
    openFileDialog(newsSingle) {
      this.newsSingle = this.$_.pick(newsSingle, this.$_.deepKeys(this.newsSingle))
      this.fileDialog = true
    },
    onPage(event) {
      this.news.meta.currentPage = event.page + 1
      this.news.meta.itemsPerPage = event.rows
      this.$fetch()
    },
    onSort(event) {
      this.news.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

      this.$fetch()
    },
    onFilter() {
      this.$fetch()
    },
    async removeMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/news/bulk/', {
              data: {
                items: this.selected.map((newsSingle) => newsSingle.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Новости успешно удалены',
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.$fetch()
        },
      })
    },
    async createNewsSingle() {
      this.loading = true

      let formData = new FormData()

      formData.append('title', this.newsSingle.title)
      formData.append('description', this.newsSingle.description)
      if (this.$refs.fileInputSecond.files[0]) formData.append('file', this.$refs.fileInputSecond.files[0])

      try {
        await this.$axios.post('/news', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Новость успешно добавлена',
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
    async updateNewsSingle() {
      this.loading = true
      try {
        await this.$axios.patch('/news/' + this.newsSingle.id, this.$_.omit(this.newsSingle, 'id', 'image'))
        this.$toast.add({
          severity: 'success',
          detail: 'Новость успешно редактирована',
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
    async removeNewsSingle(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/news/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Новость успешно удалена',
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
