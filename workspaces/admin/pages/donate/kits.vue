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
              <h5 class="m-0">Управление донат-китами</h5>
            </div>
          </template>
          <Column :style="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column field="name" header="Название"></Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button @click="removeKit(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="fileDialog" :style="{ width: '600px' }" :modal="true" header="Редактирование картинкок" class="p-fluid">
          <div v-for="server in servers" :key="server.id" class="grid mb-4 pt-2">
            <div class="col-12 md:col-6">
              <h4 v-text="server.name" />
              <Avatar v-if="!kit.images.find((img) => img.server.id == server.id)" icon="pi pi-image" size="xlarge" />
              <Image v-else width="200" :src="`${apiUrl + '/' + kit.images.find((img) => img.server.id == server.id).image}`" preview />
            </div>
            <div class="col-12 md:col-6">
              <div class="field mb-0 mt-2">
                <Button label="Загрузить" icon="pi pi-upload" @click="preUpdateImage(server.id)" />
                <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeImage(server.id)" />
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
            header="Создание/редактирование кита"
            class="p-fluid"
          >
            <VeeField
              v-model="kit.name"
              name="name"
              label="Название"
              rules="required"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>Название</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" :class="errorMessage && 'p-invalid'" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <div class="field">
              <label>Описание</label>
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
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
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
    useHead({ title: 'Донат-киты' })
    const config = useRuntimeConfig()
    return { apiUrl: config.public.apiBaseurl }
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
          detail: 'Картинка успешно обновлена',
          life: 3000,
        })
        await this.load()
      } catch {
        this.fileDialog = false
        this.$toast.add({
          severity: 'error',
          detail: 'Поддерживаются только изображения',
          life: 3000,
        })
      }
    },
    async removeImage(id) {
      try {
        await this.$api.delete(`/donates/group-kits/image/${id}/${this.kit.id}`)
        this.$toast.add({
          severity: 'success',
          detail: 'Картинка успешно удалена',
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
      this.kitDialog = true
    },
    async createKit() {
      this.loading = true
      try {
        await this.$api.post('/donates/group-kits', this.kit)
        this.$toast.add({
          severity: 'success',
          detail: 'Кит успешно добавлен',
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: 'Введены некоректные данные',
          life: 3000,
        })
      }
    },
    async updateKit() {
      this.loading = true
      try {
        await this.$api.patch('/donates/group-kits/' + this.kit.id, this.$_.omit(this.kit, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Кит успешно редактирован',
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: 'Введены некоректные данные',
          life: 3000,
        })
      }
    },
    async removeMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
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
              detail: 'Киты успешно удалены',
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
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/group-kits/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Кит успешно удален',
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
