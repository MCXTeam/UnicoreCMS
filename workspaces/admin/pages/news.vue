<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
                :label="$t('admin.delete')"
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
          v-model:filters="filters"
          dataKey="id"
          :totalRecords="news.meta.totalItems"
          :loading="loading"
          :rowsPerPageOptions="[20, 50, 100]"
          @page="onPage($event)"
          @sort="onSort($event)"
          v-model:selection="selected"
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.news_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :style="{ width: '8rem' }" sortable></Column>
          <Column field="title" :header="$t('admin.name')" sortable />
          <Column field="created" :header="$t('admin.created_date')" sortable>
            <template #body="slotProps">
              {{ $moment(slotProps.data.created).format('D MMMM YYYY, HH:mm') }}
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
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
        <Dialog v-model:visible="fileDialog" :style="{ width: '500px' }" :modal="true" :header="$t('admin.news_image')" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <div class="grid mb-4 pt-2">
              <div class="col-12 md:col-6">
                <Avatar v-if="!newsSingle.image" icon="pi pi-image" size="xlarge" />
                <Image v-else width="200" :src="`${runtimeConfig.apiBaseurl + '/' + newsSingle.image}`" preview />
              </div>
              <div class="col-12 md:col-6">
                <div class="field mb-0">
                  <Button :label="$t('admin.upload')" icon="pi pi-upload" @click="$refs.fileInput.choose()" />
                  <Button :label="$t('admin.delete')" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeImage()" />
                  <FileUpload
                    ref="fileInput"
                    :pt="{ root: { class: 'hidden' } }"
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
        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="newsSingleDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            :header="$t('admin.news_dialog')"
            class="p-fluid"
          >
            <LocaleEditorBar
              v-model="translations.locale"
              :locales="translations.locales"
              :status="translations.status"
              :isDefault="translations.isDefault"
              @copy="translations.copyFromDefault()"
            />
            <template v-if="translations.isDefault">
              <VeeField
                v-model="newsSingle.title"
                name="title"
                :label="$t('admin.name')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.name') }}</label>
                  <InputText :modelValue="value" @update:modelValue="handleChange" autofocus />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-model="newsSingle.description"
                name="description"
                :label="$t('admin.content')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <div class="flex justify-content-between align-items-center mb-2">
                    <label class="m-0">{{ $t('admin.content') }}</label>
                    <SelectButton
                      v-model="contentMode"
                      :options="contentModes"
                      optionLabel="label"
                      optionValue="value"
                      :allowEmpty="false"
                    />
                  </div>
                  <Editor v-if="contentMode === 'visual'" :modelValue="value" @update:modelValue="handleChange" editorStyle="height: 220px">
                    <template #toolbar>
                      <span class="ql-formats">
                        <button class="ql-bold"></button>
                        <button class="ql-italic"></button>
                        <button class="ql-underline"></button>
                      </span>
                    </template>
                  </Editor>
                  <Textarea v-else :modelValue="value" @update:modelValue="handleChange" class="font-mono" rows="12" spellcheck="false" />
                  <small v-if="contentMode === 'html'">{{ $t('admin.html_sanitize_hint') }}</small>
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field">
                <label>{{ $t('admin.short_description') }}</label>
                <Textarea v-model="newsSingle.short_description" :autoResize="true" rows="3" />
                <small>{{ $t('admin.short_description_hint') }}</small>
              </div>
              <div class="field flex align-items-center gap-2">
                <Checkbox v-model="newsSingle.full_size" :binary="true" inputId="news-full-size" />
                <label for="news-full-size" class="m-0">{{ $t('admin.news_full_size') }}</label>
              </div>
              <div class="field" v-if="isSuperuser">
                <label>{{ $t('admin.custom_css') }}</label>
                <Textarea
                  v-model="newsSingle.custom_css"
                  class="font-mono"
                  rows="6"
                  spellcheck="false"
                  placeholder=".my-block { color: red }"
                />
                <small>{{ $t('admin.custom_css_hint_news') }}</small>
              </div>
              <div class="field" v-if="isSuperuser">
                <label>{{ $t('admin.custom_js') }}</label>
                <Textarea v-model="newsSingle.custom_js" class="font-mono" rows="6" spellcheck="false" placeholder="console.log('hello')" />
                <small class="p-error"> {{ $t('admin.custom_js_hint') }} </small>
              </div>
              <div v-if="!updateMode">
                <FileUpload ref="fileInputSecond" :showUploadButton="false" name="file" accept="image/*">
                  <template #empty>
                    <p>{{ $t('admin.choose_image') }}</p>
                  </template>
                </FileUpload>
              </div>
            </template>
            <ContentTranslationFields v-else :translations="translations" />
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateNewsSingle() : createNewsSingle()"
              />
            </template>
          </Dialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { sortTransform } from '~/helpers'
import { FilterMatchMode } from '@primevue/core/api'
import { Form, Field } from 'vee-validate'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const translations = useContentTranslations('news')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_news')) })
    const auth = useAuthStore()
    return { translations, runtimeConfig: useRuntimeConfig().public, auth }
  },

  computed: {
    contentModes() {
      return [
        { label: this.$t('admin.visual'), value: 'visual' },
        { label: 'HTML', value: 'html' },
      ]
    },
    isSuperuser() {
      return !!this.auth.user?.superuser
    },
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
        short_description: null,
        full_size: false,
        custom_css: null,
        custom_js: null,
        image: null,
        link: null,
      },
      contentMode: 'visual',
      selected: null,
      newsSingleDialog: false,
      fileDialog: false,
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
      this.selected = null
      this.news = await this.$api
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
    async uploadImage(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.patch(`/news/image/` + this.newsSingle.id, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.image_updated'),
          life: 3000,
        })
        await this.load()
      } catch {
        this.fileDialog = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.images_only'),
          life: 3000,
        })
      }
    },
    async removeImage() {
      try {
        await this.$api.delete(`/news/image/` + this.newsSingle.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.image_deleted'),
          life: 3000,
        })
        await this.load()
      } catch {}
    },
    hideDialog() {
      this.newsSingleDialog = false
    },
    async openDialog(newsSingle = null) {
      this.updateMode = !!newsSingle
      if (newsSingle) {
        const full = await this.$api.get(`/news/${newsSingle.id}`).then((res) => res.data)

        this.newsSingle = this.$_.pick(full, this.$_.deepKeys(this.newsSingle))
      } else {
        this.newsSingle = {
          id: null,
          title: null,
          description: null,
          short_description: null,
          full_size: false,
          custom_css: null,
          custom_js: null,
          image: null,
          link: null,
        }
      }
      this.translations.attach(this.newsSingle)
      await this.translations.load(newsSingle ? newsSingle.id : null)
      this.newsSingleDialog = true
    },
    openFileDialog(newsSingle) {
      this.newsSingle = this.$_.pick(newsSingle, this.$_.deepKeys(this.newsSingle))
      this.fileDialog = true
    },
    onPage(event) {
      this.news.meta.currentPage = event.page + 1
      this.news.meta.itemsPerPage = event.rows
      this.load()
    },
    onSort(event) {
      this.news.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

      this.load()
    },
    onFilter() {
      this.load()
    },
    async removeMany() {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.delete_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/news/bulk', {
              data: {
                items: this.selected.map((newsSingle) => newsSingle.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.news_many_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async createNewsSingle() {
      this.loading = true

      let formData = new FormData()

      formData.append('title', this.newsSingle.title)
      formData.append('description', this.newsSingle.description)
      formData.append('full_size', this.newsSingle.full_size ? 'true' : 'false')
      if (this.newsSingle.short_description) formData.append('short_description', this.newsSingle.short_description)
      if (this.newsSingle.custom_css) formData.append('custom_css', this.newsSingle.custom_css)
      if (this.newsSingle.custom_js) formData.append('custom_js', this.newsSingle.custom_js)
      if (this.$refs.fileInputSecond.files[0]) formData.append('file', this.$refs.fileInputSecond.files[0])

      try {
        const { data } = await this.$api.post('/news', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        await this.translations.save(data.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.news_created'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async updateNewsSingle() {
      this.loading = true
      try {
        await this.$api.patch('/news/' + this.newsSingle.id, this.$_.omit(this.newsSingle, 'id', 'image'))

        await this.translations.save(this.newsSingle.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.news_updated'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async removeNewsSingle(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/news/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.news_deleted'),
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
