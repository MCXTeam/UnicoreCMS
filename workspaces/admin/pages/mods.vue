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
          :value="mods.data"
          lazy
          paginator
          :rows="mods.meta.itemsPerPage"
          :filters.sync="filters"
          dataKey="id"
          :totalRecords="mods.meta.totalItems"
          :loading="loading"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          :selection.sync="selected"
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление модами</h5>
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
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button
                @click="removeMod(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>
        <Dialog :visible.sync="fileDialog" :style="{ width: '400px' }" :modal="true" header="Иконка мода" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <Avatar v-if="mod.icon" :image="`${$config.apiUrl + '/' + mod.icon}`" size="xlarge" shape="circle" />
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
            :visible.sync="modDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование мода"
            class="p-fluid"
          >
            <ValidationProvider name="Название" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Название</label>
                <InputText v-model="mod.name" autofocus />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field">
              <label>Описание</label>
              <Editor v-model="mod.description" editorStyle="height: 220px">
                <template #toolbar>
                  <span class="ql-formats">
                    <button class="ql-bold"></button>
                    <button class="ql-italic"></button>
                    <button class="ql-underline"></button>
                    <button class="ql-link"></button>
                  </span>
                </template>
              </Editor>
            </div>
            <ValidationProvider name="URL" rules="url" v-slot="{ errors }">
              <div class="field">
                <label>Ссылка</label>
                <InputText v-model="mod.link" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateMod() : createMod()"
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
    title: 'Моды',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      mods: {
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
      mod: {
        id: null,
        name: null,
        link: null,
        icon: null,
        description: null,
      },
      selected: null,
      modDialog: false,
      fileDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.selected = null
    this.mods = await this.$axios
      .get('/servers/mods', {
        params: {
          page: this.mods.meta.currentPage,
          limit: this.mods.meta.itemsPerPage,
          search: this.filters.global.value,
          sortBy: this.mods.meta.sortBy,
        },
      })
      .then((res) => res.data)
    this.modDialog = false
    this.fileDialog = false
    this.loading = false
  },
  methods: {
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$axios.patch(`/servers/mods/icon/` + this.mod.id, formData, {
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
        await this.$axios.delete(`/servers/mods/icon/` + this.mod.id)
        this.$toast.add({
          severity: 'success',
          detail: 'Иконка успешно удалена',
          life: 3000,
        })
        await this.$fetch()
      } catch {}
    },
    hideDialog() {
      this.modDialog = false
    },
    openDialog(mod = null) {
      this.updateMode = !!mod
      if (mod) {
        this.mod = this.$_.pick(mod, this.$_.deepKeys(this.mod))
      } else {
        this.mod = {
          id: null,
          name: null,
          description: null,
          link: null,
          icon: null,
        }
      }
      this.modDialog = true
    },
    openFileDialog(mod) {
      this.mod = this.$_.pick(mod, this.$_.deepKeys(this.mod))
      this.fileDialog = true
    },
    onPage(event) {
      this.mods.meta.currentPage = event.page + 1
      this.mods.meta.itemsPerPage = event.rows
      this.$fetch()
    },
    onSort(event) {
      this.mods.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

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
            await this.$axios.delete('/servers/mods/bulk/', {
              data: {
                items: this.selected.map((mod) => mod.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Моды успешно удалены',
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.$fetch()
        },
      })
    },
    async createMod() {
      this.loading = true
      try {
        await this.$axios.post('/servers/mods', this.mod)
        this.$toast.add({
          severity: 'success',
          detail: 'Мод успешно добавлен',
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
    async updateMod() {
      this.loading = true
      try {
        await this.$axios.patch('/servers/mods/' + this.mod.id, this.$_.omit(this.mod, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Мод успешно редактирован',
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
    async removeMod(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/servers/mods/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Мод успешно удален',
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
