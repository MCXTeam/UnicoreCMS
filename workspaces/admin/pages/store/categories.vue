<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template #start>
            <div class="my-2">
              <Button v-if="canCreate" :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
                v-if="canDeleteMany"
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
          :value="categories.data"
          :loading="loading"
          :rows="categories.meta.itemsPerPage"
          paginator
          v-model:filters="filters"
          :totalRecords="categories.meta.totalItems"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          v-model:selection="selected"
          rowHover
          lazy
          responsiveLayout="scroll"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.categories_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column v-if="canDeleteMany" selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column sortable field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column sortable field="name" :header="$t('admin.name')">
            <template #body="slotProps">
              <div class="flex align-items-center">
                <IconAvatar :path="slotProps.data.icon" />
                <span class="ml-2">{{ slotProps.data.name }}</span>
              </div>
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="canUpdate"
                @click="openDialog(slotProps.data)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success mr-2"
              />
              <Button
                v-if="canUpdate"
                @click="openFileDialog(slotProps.data)"
                icon="pi pi-images"
                class="p-button-rounded p-button-secondary mr-2"
              />
              <Button
                @click="removeCategory(slotProps.data.id)"
                v-if="canDelete && !slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="fileDialog" :style="{ width: '400px' }" :modal="true" :header="$t('admin.category_icon')" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <IconAvatar :path="category.icon" size="xlarge" />
            <div class="field ml-6 mb-0">
              <Button :label="$t('admin.upload')" icon="pi pi-upload" @click="$refs.fileInput.choose()" />
              <Button :label="$t('admin.delete')" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeIcon()" />
              <FileUpload
                ref="fileInput"
                :pt="{ root: { class: 'hidden' } }"
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

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="categoryDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            :header="$t('admin.category_dialog')"
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
                v-model="category.name"
                name="name"
                :label="$t('admin.name')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.name') }}<span class="p-error"> *</span></label>
                  <InputText
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @blur="handleBlur"
                    autofocus
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field">
                <label>{{ $t('admin.description') }}</label>
                <Textarea v-model="category.description" :autoResize="true" rows="5" cols="30" />
              </div>
              <div class="field">
                <label>{{ $t('admin.priority_sort') }}</label>
                <InputNumber v-model="category.priority" />
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
                @click="updateMode ? updateCategory() : createCategory()"
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
    const translations = useContentTranslations('category')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_categories')) })
    const access = useAccess({
      canCreate: 'panel.store.categories.create',
      canUpdate: 'panel.store.categories.update',
      canDelete: 'panel.store.categories.delete',
      canDeleteMany: 'panel.store.categories.delete.many',
    })

    return {
      ...access,
      translations,
    }
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
        priority: null,
        icon: null,
      },
      fileDialog: false,
      categoryDialog: false,
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
      this.categories = await this.$api
        .get('/store/categories', {
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
    onPage(event) {
      this.categories.meta.currentPage = event.page + 1
      this.categories.meta.itemsPerPage = event.rows

      this.load()
    },
    onSort(event) {
      this.categories.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

      this.load()
    },
    onFilter() {
      this.load()
    },
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.patch(`/store/categories/icon/` + this.category.id, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.icon_updated'),
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
    async removeIcon() {
      try {
        await this.$api.delete(`/store/categories/icon/` + this.category.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.icon_deleted'),
          life: 3000,
        })
        await this.load()
      } catch {}
    },
    hideDialog() {
      this.categoryDialog = false
    },
    async openDialog(category = null) {
      this.updateMode = !!category
      if (category) {
        this.category = this.$_.pick(category, this.$_.deepKeys(this.category))
      } else {
        this.category = {
          id: null,
          name: null,
          description: null,
          priority: null,
          icon: null,
        }
      }
      this.translations.attach(this.category)
      await this.translations.load(category ? category.id : null)
      this.categoryDialog = true
    },
    openFileDialog(category) {
      this.category = this.$_.pick(category, this.$_.deepKeys(this.category))
      this.fileDialog = true
    },
    async createCategory() {
      this.loading = true
      try {
        const { data } = await this.$api.post('/store/categories', this.category)

        await this.translations.save(data.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.category_created'),
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
    async updateCategory() {
      this.loading = true
      try {
        await this.$api.patch('/store/categories/' + this.category.id, this.$_.omit(this.category, 'id'))

        await this.translations.save(this.category.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.category_updated'),
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
    async removeCategory(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/store/categories/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.category_deleted'),
              life: 3000,
            })
          } catch {}
          await this.load()
        },
      })
    },
    async removeMany() {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.delete_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/store/categories/bulk', {
              data: {
                items: this.selected.map((category) => category.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.categories_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
  },
}
</script>
