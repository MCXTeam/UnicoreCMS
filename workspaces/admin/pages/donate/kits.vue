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
          :value="kits"
          :loading="loading"
          rowHover
          responsiveLayout="scroll"
          v-model:selection="selected"
          @row-reorder="onKitsReorder"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.donate_kits_title') }}</h5>
            </div>
          </template>
          <Column v-if="canSort" :style="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
          <Column v-if="canDeleteMany" selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column field="name" :header="$t('admin.name')"></Column>
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
                v-if="canDelete"
                @click="removeKit(slotProps.data.id)"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="fileDialog" :style="{ width: '600px' }" :modal="true" :header="$t('admin.kit_images')" class="p-fluid">
          <div v-for="server in servers" :key="server.id" class="grid mb-4 pt-2">
            <div class="col-12 md:col-6">
              <h4 v-text="server.name" />
              <Avatar v-if="!kit.images.find((img) => img.server.id == server.id)" icon="pi pi-image" size="xlarge" />
              <Image v-else width="200" :src="`${apiUrl + '/' + kit.images.find((img) => img.server.id == server.id).image}`" preview />
            </div>
            <div class="col-12 md:col-6">
              <div class="field mb-0 mt-2">
                <Button :label="$t('admin.upload')" icon="pi pi-upload" @click="preUpdateImage(server.id)" />
                <Button :label="$t('admin.delete')" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeImage(server.id)" />
                <FileUpload
                  :ref="'imageInput-' + server.id"
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
        </Dialog>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="kitDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            :header="$t('admin.kit_dialog')"
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
                v-model="kit.name"
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
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field">
                <label>{{ $t('admin.description') }}</label>
                <Editor v-model="kit.description" editorStyle="height: 220px">
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
            </template>
            <ContentTranslationFields v-else :translations="translations" />
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateKit() : createKit()"
              />
            </template>
          </Dialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { Form, Field } from 'vee-validate'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const translations = useContentTranslations('group_kit')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_donate_kits')) })
    const config = useRuntimeConfig()
    const access = useAccess({
      canCreate: 'panel.donate.kits.create',
      canUpdate: 'panel.donate.kits.update',
      canDelete: 'panel.donate.kits.delete',
      canDeleteMany: 'panel.donate.kits.delete.many',
      canSort: 'panel.donate.sort',
    })

    return {
      ...access,
      translations,
      apiUrl: config.public.apiBaseurl,
    }
  },
  data() {
    return {
      kits: null,
      loading: true,
      selected: null,
      updateMode: false,
      fileDialog: false,
      kitServer: null,
      kit: {
        id: null,
        name: null,
        description: null,
        images: [],
      },
      servers: null,
      kitDialog: false,
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.kitDialog = false
      this.fileDialog = false
      this.kits = await this.$api.get('/donates/group-kits').then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)
      this.loading = false
    },
    async onKitsReorder(event) {
      this.loading = true
      await this.$api.post('/donates/group-kits/sort', {
        items: event.value.map((kit, priority) => ({
          id: kit.id,
          priority,
        })),
      })
      this.load()
    },
    hideDialog() {
      this.kitDialog = false
    },
    preUpdateImage(id) {
      this.kitServer = id
      const input = this.$refs['imageInput-' + id]
      ;(Array.isArray(input) ? input[0] : input).choose()
    },
    async uploadImage(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.patch(`/donates/group-kits/image/${this.kitServer}/${this.kit.id}`, formData, {
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
    async removeImage(id) {
      try {
        await this.$api.delete(`/donates/group-kits/image/${id}/${this.kit.id}`)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.image_deleted'),
          life: 3000,
        })
        await this.load()
      } catch {}
    },
    async openFileDialog(kit) {
      this.kit = this.$_.pick(kit, this.$_.deepKeys(this.kit))
      this.fileDialog = true
    },
    async openDialog(kit = null) {
      this.updateMode = !!kit
      if (kit) {
        this.kit = this.$_.pick(kit, this.$_.deepKeys(this.kit))
      } else {
        this.kit = {
          id: null,
          name: null,
          description: null,
          images: [],
        }
      }
      this.translations.attach(this.kit)
      await this.translations.load(kit ? kit.id : null)
      this.kitDialog = true
    },
    async createKit() {
      this.loading = true
      try {
        const { data } = await this.$api.post('/donates/group-kits', this.kit)

        await this.translations.save(data.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.kit_created'),
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
    async updateKit() {
      this.loading = true
      try {
        await this.$api.patch('/donates/group-kits/' + this.kit.id, this.$_.omit(this.kit, 'id'))

        await this.translations.save(this.kit.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.kit_updated'),
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
    async removeMany() {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.delete_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/group-kits/bulk', {
              data: {
                items: this.selected.map((kit) => kit.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.kits_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async removeKit(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/group-kits/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.kit_deleted'),
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
