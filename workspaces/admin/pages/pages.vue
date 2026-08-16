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
          <SectionedDialog
            v-model:visible="pageDialog"
            v-model="section"
            :sections="sections"
            :header="$t('admin.page_dialog')"
            width="800px"
            class="p-fluid"
          >
            <template #before>
              <LocaleEditorBar
                v-model="translations.locale"
                :locales="translations.locales"
                :status="translations.status"
                :isDefault="translations.isDefault"
                @copy="translations.copyFromDefault()"
              />
            </template>

            <template #main>
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
                <div class="flex align-items-center gap-2">
                  <Checkbox v-model="page.full_size" :binary="true" inputId="page-full-size" @change="onFullSize()" />
                  <label for="page-full-size" class="m-0">{{ $t('admin.page_full_size') }}</label>
                </div>
                <small v-if="page.full_size">{{ $t('admin.full_size_hint') }}</small>
              </div>
              <div class="field">
                <label>{{ $t('admin.meta_description') }}</label>
                <Textarea v-model="page.description" :autoResize="true" />
              </div>
            </template>

            <template #content>
              <div class="field">
                <div class="flex justify-content-between align-items-center mb-2">
                  <label class="m-0">{{ $t('admin.content') }}</label>
                  <SelectButton v-model="contentMode" :options="contentModes" optionLabel="label" optionValue="value" :allowEmpty="false" />
                </div>
                <Editor v-if="contentMode === 'visual'" v-model="page.content" editorStyle="height: 400px"></Editor>
                <Textarea v-else v-model="page.content" class="font-mono" rows="18" spellcheck="false" />
                <small v-if="contentMode === 'html'">{{ $t('admin.html_sanitize_hint') }}</small>
              </div>
            </template>

            <template #extra>
              <div class="field">
                <label>{{ $t('admin.custom_css') }}</label>
                <Textarea v-model="page.custom_css" class="font-mono" rows="6" spellcheck="false" placeholder=".my-block { color: red }" />
                <small>{{ $t('admin.custom_css_hint') }}</small>
              </div>
              <div class="field">
                <label>{{ $t('admin.custom_js') }}</label>
                <Textarea v-model="page.custom_js" class="font-mono" rows="6" spellcheck="false" placeholder="console.log('hello')" />
                <small class="text-red-500"> {{ $t('admin.custom_js_hint') }} </small>
              </div>
            </template>

            <template #translation>
              <ContentTranslationFields :translations="translations" />
            </template>

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
          </SectionedDialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { fullSizeTemplate } from '~/constants'
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
    sections() {
      const isDefault = this.translations.isDefault

      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle', hidden: !isDefault },
        { key: 'content', label: 'admin.section_content', icon: 'pi pi-align-left', hidden: !isDefault },
        { key: 'extra', label: 'admin.section_extra', icon: 'pi pi-code', hidden: !isDefault || !this.isSuperuser },
        { key: 'translation', label: 'admin.section_translation', icon: 'pi pi-language', hidden: isDefault },
      ]
    },
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
      section: 'main',
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    onFullSize() {
      if (!this.page.full_size || String(this.page.content || '').trim()) return

      this.page.content = fullSizeTemplate(this.$t('admin.full_size_template_heading'), this.$t('admin.full_size_template_text'))
      this.contentMode = 'html'
    },
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
