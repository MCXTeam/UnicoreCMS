<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button label="Создать" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
            </div>
          </template>
        </Toolbar>

        <DataTable
          :value="pages"
          :loading="loading"
          :rows="20"
          paginator
          :filters.sync="filters"
          rowHover
          responsiveLayout="scroll"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление страницами</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column sortable field="id" header="ID" :styles="{ width: '8rem' }"></Column>
          <Column sortable field="title" header="Заголовок"></Column>
          <Column sortable field="path" header="Путь"></Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button
                @click="removePage(slotProps.data.id)"
                v-if="!slotProps.data.is_rules"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog :style="{ width: '800px' }" :visible.sync="pageDialog" :closable="false" :modal="true" header="Создание/редактирование страницы" class="p-fluid">
            <ValidationProvider
              name="Путь"
              :rules="{
                required: true,
                regex: /^(?!\/)[a-z\/\-_]+$/,
              }"
              v-slot="{ errors }"
            >
              <div class="field">
                <label>Путь</label>
                <InputText v-model="page.path" autofocus />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Заголовок" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Заголовок</label>
                <InputText v-model="page.title" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field">
              <label>Содержимое</label>
              <Editor v-model="page.content" editorStyle="height: 400px"></Editor>
            </div>
            <div class="field">
              <label>Описание (meta-description)</label>
              <Textarea v-model="page.description" :autoResize="true" />
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updatePage() : createPage()"
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
    title: 'Страницы',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      pages: null,
      loading: true,
      mods: null,
      updateMode: false,
      page: {
        id: null,
        title: null,
        description: null,
        path: null,
        content: null,
      },
      pageDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.pageDialog = false
    this.pages = await this.$axios.get('/pages').then((res) => res.data)
    this.loading = false
  },
  methods: {
    hideDialog() {
      this.pageDialog = false
    },
    async openDialog(page = null) {
      this.updateMode = !!page
      if (page) {
        this.page = this.$_.pick(await this.$axios.get('/pages/' + page.id).then((res) => res.data), this.$_.deepKeys(this.page))
      } else {
        this.page = {
          id: null,
          title: null,
          description: null,
          path: null,
          content: null,
        }
      }
      this.pageDialog = true
    },
    async createPage() {
      this.loading = true
      try {
        await this.$axios.post('/pages', this.page)
        this.$toast.add({
          severity: 'success',
          detail: 'Страница успешно добавлена',
          life: 3000,
        })
        await this.$fetch()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: 'Страница с идентичным путем уже присутствует',
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
    async updatePage() {
      this.loading = true
      try {
        await this.$axios.patch('/pages/' + this.page.id, this.$_.omit(this.page, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Страница успешно редактирована',
          life: 3000,
        })
        await this.$fetch()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: 'Страница с идентичным путем уже присутствует',
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
    async removePage(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/pages/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Страница успешно удалена',
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
