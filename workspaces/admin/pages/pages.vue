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
          v-model:filters="filters"
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
          <Column sortable field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column sortable field="title" header="Заголовок"></Column>
          <Column sortable field="path" header="Путь"></Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
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

        <VeeForm v-slot="{ meta }">
          <Dialog
            :style="{ width: '800px' }"
            v-model:visible="pageDialog"
            :closable="false"
            :modal="true"
            header="Создание/редактирование страницы"
            class="p-fluid"
          >
            <VeeField
              v-model="page.path"
              name="path"
              label="Путь"
              :rules="{ required: true, regex: /^(?!\/)[a-z\/\-_]+$/ }"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>Путь</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" autofocus />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField v-model="page.title" name="title" label="Заголовок" rules="required" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Заголовок</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <div class="field">
              <div class="flex justify-content-between align-items-center mb-2">
                <label class="m-0">Содержимое</label>
                <SelectButton v-model="contentMode" :options="contentModes" optionLabel="label" optionValue="value" :allowEmpty="false" />
              </div>
              <Editor v-if="contentMode === 'visual'" v-model="page.content" editorStyle="height: 400px"></Editor>
              <Textarea v-else v-model="page.content" class="font-mono" rows="18" spellcheck="false" />
              <small v-if="contentMode === 'html'">
                Небезопасные теги и атрибуты (script, style, iframe, обработчики событий) вырезаются при сохранении.
              </small>
            </div>
            <div class="field" v-if="isSuperuser">
              <label>Кастомный CSS</label>
              <Textarea v-model="page.custom_css" class="font-mono" rows="6" spellcheck="false" placeholder=".my-block { color: red }" />
              <small>Подключается только на этой странице. Доступно суперпользователю.</small>
            </div>
            <div class="field" v-if="isSuperuser">
              <label>Кастомный JS</label>
              <Textarea v-model="page.custom_js" class="font-mono" rows="6" spellcheck="false" placeholder="console.log('hello')" />
              <small class="p-error">
                Выполняется у каждого посетителя страницы без проверок — вставляйте только собственный код.
              </small>
            </div>
            <div class="field">
              <label>Описание (meta-description)</label>
              <Textarea v-model="page.description" :autoResize="true" />
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updatePage() : createPage()"
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
    useHead({ title: 'Страницы' })
    const auth = useAuthStore()
    return { auth }
  },

  computed: {
    isSuperuser() {
      return !!this.auth.user?.superuser
    },
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
        custom_css: null,
        custom_js: null,
      },
      contentMode: 'visual',
      contentModes: [
        { label: 'Визуально', value: 'visual' },
        { label: 'HTML', value: 'html' },
      ],
      pageDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.pageDialog = false
      this.pages = await this.$api.get('/pages').then((res) => res.data)
      this.loading = false
    },
    hideDialog() {
      this.pageDialog = false
    },
    async openDialog(page = null) {
      this.updateMode = !!page
      if (page) {
        this.page = this.$_.pick(await this.$api.get('/pages/' + page.id).then((res) => res.data), this.$_.deepKeys(this.page))
      } else {
        this.page = {
          id: null,
          title: null,
          description: null,
          path: null,
          content: null,
          custom_css: null,
          custom_js: null,
        }
      }
      this.pageDialog = true
    },
    async createPage() {
      this.loading = true
      try {
        await this.$api.post('/pages', this.page)
        this.$toast.add({
          severity: 'success',
          detail: 'Страница успешно добавлена',
          life: 3000,
        })
        await this.load()
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
        await this.$api.patch('/pages/' + this.page.id, this.$_.omit(this.page, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Страница успешно редактирована',
          life: 3000,
        })
        await this.load()
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
            await this.$api.delete('/pages/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Страница успешно удалена',
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
