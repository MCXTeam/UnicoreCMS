<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
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
              <h5 class="m-0">{{ $t('admin.pages_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column sortable field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column sortable field="title" :header="$t('admin.heading')"></Column>
          <Column sortable field="path" :header="$t('admin.path')"></Column>
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
            :header="$t('admin.page_dialog')"
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
                v-model="page.path"
                name="path"
                :label="$t('admin.path')"
                :rules="{ required: true, regex: /^(?!\/)[a-z\/\-_]+$/ }"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.path') }}</label>
                  <InputText :modelValue="value" @update:modelValue="handleChange" autofocus />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-model="page.title"
                name="title"
                :label="$t('admin.heading')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.heading') }}</label>
                  <InputText :modelValue="value" @update:modelValue="handleChange" />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field">
                <div class="flex justify-content-between align-items-center mb-2">
                  <label class="m-0">{{ $t('admin.content') }}</label>
                  <SelectButton v-model="contentMode" :options="contentModes" optionLabel="label" optionValue="value" :allowEmpty="false" />
                </div>
                <Editor v-if="contentMode === 'visual'" v-model="page.content" editorStyle="height: 400px"></Editor>
                <Textarea v-else v-model="page.content" class="font-mono" rows="18" spellcheck="false" />
                <small v-if="contentMode === 'html'">{{ $t('admin.html_sanitize_hint') }}</small>
              </div>
              <div class="field flex align-items-center gap-2">
                <Checkbox v-model="page.full_size" :binary="true" inputId="page-full-size" />
                <label for="page-full-size" class="m-0">{{ $t('admin.page_full_size') }}</label>
              </div>
              <div class="field" v-if="isSuperuser">
                <label>{{ $t('admin.custom_css') }}</label>
                <Textarea v-model="page.custom_css" class="font-mono" rows="6" spellcheck="false" placeholder=".my-block { color: red }" />
                <small>{{ $t('admin.custom_css_hint') }}</small>
              </div>
              <div class="field" v-if="isSuperuser">
                <label>{{ $t('admin.custom_js') }}</label>
                <Textarea v-model="page.custom_js" class="font-mono" rows="6" spellcheck="false" placeholder="console.log('hello')" />
                <small class="p-error"> {{ $t('admin.custom_js_hint') }} </small>
              </div>
              <div class="field">
                <label>{{ $t('admin.meta_description') }}</label>
                <Textarea v-model="page.description" :autoResize="true" />
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
    const translations = useContentTranslations('page')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_pages')) })
    const auth = useAuthStore()
    return { translations, auth }
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
        full_size: false,
        custom_css: null,
        custom_js: null,
      },
      contentMode: 'visual',
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
          full_size: false,
          custom_css: null,
          custom_js: null,
        }
      }
      this.translations.attach(this.page)
      await this.translations.load(page ? page.id : null)
      this.pageDialog = true
    },
    async createPage() {
      this.loading = true
      try {
        const { data } = await this.$api.post('/pages', this.page)

        await this.translations.save(data.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.page_created'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: this.$t('admin.page_path_exists'),
            life: 3000,
          })
        } else {
          this.$toast.add({
            severity: 'error',
            detail: this.$t('admin.invalid_data'),
            life: 3000,
          })
        }
      }
    },
    async updatePage() {
      this.loading = true
      try {
        await this.$api.patch('/pages/' + this.page.id, this.$_.omit(this.page, 'id'))

        await this.translations.save(this.page.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.page_updated'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: this.$t('admin.page_path_exists'),
            life: 3000,
          })
        } else {
          this.$toast.add({
            severity: 'error',
            detail: this.$t('admin.invalid_data'),
            life: 3000,
          })
        }
      }
    },
    async removePage(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/pages/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.page_deleted'),
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
