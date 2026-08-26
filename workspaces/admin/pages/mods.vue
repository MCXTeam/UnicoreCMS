<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
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
          :value="mods.data"
          lazy
          paginator
          :rows="mods.meta.itemsPerPage"
          v-model:filters="filters"
          dataKey="id"
          :totalRecords="mods.meta.totalItems"
          :loading="loading"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          v-model:selection="selected"
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.mods_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :style="{ width: '8rem' }" sortable></Column>
          <Column field="name" :header="$t('admin.name')" sortable>
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
                  v-if="canUpdate" @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button
                @click="removeMod(slotProps.data.id)"
                v-if="canDelete && !slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>
        <Dialog v-model:visible="fileDialog" :style="{ width: '400px' }" :modal="true" :header="$t('admin.mod_icon')" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <IconAvatar :path="mod.icon" size="xlarge" />
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
            v-model:visible="modDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            :header="$t('admin.mod_dialog')"
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
                v-model="mod.name"
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
              <VeeField v-model="mod.link" name="link" label="URL" rules="url" v-slot="{ value, errorMessage, handleChange, handleBlur }">
                <div class="field">
                  <label>{{ $t('admin.link') }}</label>
                  <InputText
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @blur="handleBlur"
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
            </template>
            <ContentTranslationFields v-else :translations="translations" />
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateMod() : createMod()"
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
    const translations = useContentTranslations('mod')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_mods')) })
    const access = useAccess({
      canCreate: 'panel.mods.create',
      canUpdate: 'panel.mods.update',
      canDelete: 'panel.mods.delete',
      canDeleteMany: 'panel.mods.delete.many',
    })

    return {
      ...access,
      translations,
    }
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
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.selected = null
      this.mods = await this.$api
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
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.patch(`/servers/mods/icon/` + this.mod.id, formData, {
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
        await this.$api.delete(`/servers/mods/icon/` + this.mod.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.icon_deleted'),
          life: 3000,
        })
        await this.load()
      } catch {}
    },
    hideDialog() {
      this.modDialog = false
    },
    async openDialog(mod = null) {
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
      this.translations.attach(this.mod)
      await this.translations.load(mod ? mod.id : null)
      this.modDialog = true
    },
    openFileDialog(mod) {
      this.mod = this.$_.pick(mod, this.$_.deepKeys(this.mod))
      this.fileDialog = true
    },
    onPage(event) {
      this.mods.meta.currentPage = event.page + 1
      this.mods.meta.itemsPerPage = event.rows
      this.load()
    },
    onSort(event) {
      this.mods.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

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
            await this.$api.delete('/servers/mods/bulk', {
              data: {
                items: this.selected.map((mod) => mod.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.mods_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async createMod() {
      this.loading = true
      try {
        const { data } = await this.$api.post('/servers/mods', this.mod)

        await this.translations.save(data.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.mod_created'),
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
    async updateMod() {
      this.loading = true
      try {
        await this.$api.patch('/servers/mods/' + this.mod.id, this.$_.omit(this.mod, 'id'))

        await this.translations.save(this.mod.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.mod_updated'),
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
    async removeMod(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/servers/mods/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.mod_deleted'),
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
