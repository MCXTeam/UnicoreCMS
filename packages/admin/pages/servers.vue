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
          :value="servers"
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
              <h5 class="m-0">Управление серверами</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column sortable field="id" header="ID" :styles="{ width: '8rem' }"></Column>
          <Column sortable field="name" header="Название">
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
                @click="removeServer(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog :visible.sync="fileDialog" :style="{ width: '600px' }" :modal="true" header="Редактирование медиа" class="p-fluid">
          <label>Иконка сервера</label>
          <div class="grid mb-4 pt-2">
            <div class="col-6">
              <Avatar v-if="server.icon" :image="`${$config.apiUrl + '/' + server.icon}`" size="xlarge" shape="circle" />
              <Avatar v-else icon="pi pi-image" size="xlarge" shape="circle" />
            </div>
            <div class="col-6">
              <div class="field mb-0 mt-2">
                <Button label="Загрузить" icon="pi pi-upload" @click="$refs.iconInput.choose()" />
                <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeMedia('icon')" />
                <FileUpload
                  ref="iconInput"
                  style="display: none"
                  mode="basic"
                  name="file"
                  accept="image/*"
                  :auto="true"
                  :customUpload="true"
                  @uploader="uploadMedia($event, 'icon')"
                />
              </div>
            </div>
          </div>
          <label>Изображение сервера</label>
          <div class="grid mb-4 pt-2">
            <div class="col-12 md:col-6">
              <Avatar v-if="!server.image" icon="pi pi-image" size="xlarge" />
              <ImagePreview v-else width="200" :src="`${$config.apiUrl + '/' + server.image}`" preview />
            </div>
            <div class="col-12 md:col-6">
              <div class="field mb-0 mt-2">
                <Button label="Загрузить" icon="pi pi-upload" @click="$refs.imageInput.choose()" />
                <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeMedia('image')" />
                <FileUpload
                  ref="imageInput"
                  style="display: none"
                  mode="basic"
                  name="file"
                  accept="image/*"
                  :auto="true"
                  :customUpload="true"
                  @uploader="uploadMedia($event, 'image')"
                />
              </div>
            </div>
          </div>
        </Dialog>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="serverDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование сервера"
            class="p-fluid"
          >
            <div class="grid">
              <div class="col-12 md:col-6">
                <ValidationProvider
                  name="ID (a-z)"
                  :rules="{
                    required: true,
                    regex: /^[a-z]+$/,
                  }"
                  v-slot="{ errors }"
                >
                  <div class="field">
                    <label>ID</label>
                    <InputText :disabled="updateMode" v-model="server.id" autofocus />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
              <div class="col-12 md:col-6">
                <ValidationProvider name="Название" rules="required" v-slot="{ errors }">
                  <div class="field">
                    <label>Название</label>
                    <InputText v-model="server.name" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
              <div class="col-12">
                <ValidationProvider name="Версия" rules="required" v-slot="{ errors }">
                  <div class="field">
                    <label>Версия</label>
                    <InputText v-model="server.version" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
                <div class="field">
                  <label>Слоган</label>
                  <InputText v-model="server.slogan" />
                </div>
                <div class="field">
                  <label>Моды</label>
                  <AutoComplete
                    v-model="server.mods"
                    :multiple="true"
                    :suggestions="mods"
                    @complete="searchMod($event)"
                    field="name"
                    appendTo="body"
                    placeholder="Выберите моды"
                  >
                    <template #item="slotProps">
                      <div class="flex align-items-center">
                        <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                        <Avatar v-else icon="pi pi-image" shape="circle" />
                        <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                      </div>
                    </template>
                  </AutoComplete>
                </div>
                <div class="field">
                  <label>Описание</label>
                  <Editor v-model="server.content" editorStyle="height: 220px">
                    <template #toolbar>
                      <span class="ql-formats">
                        <button class="ql-bold"></button>
                        <button class="ql-italic"></button>
                        <button class="ql-underline"></button>
                      </span>
                    </template>
                  </Editor>
                </div>
                <div class="field">
                  <label>Описание (meta-description)</label>
                  <Textarea v-model="server.description" :autoResize="true" />
                </div>
              </div>
              <div class="col-12 md:col-6">
                <ValidationProvider name="Query хост" rules="required" v-slot="{ errors }">
                  <div class="field">
                    <label>Query хост</label>
                    <InputText v-model="server.query.host" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
              <div class="col-12 md:col-6">
                <ValidationProvider name="Query порт" rules="required|min_value:0|max_value:65535" v-slot="{ errors }">
                  <div class="field">
                    <label>Query порт</label>
                    <InputNumber :useGrouping="false" v-model="server.query.port" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateServer() : createServer()"
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
    title: 'Серверы',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      servers: null,
      loading: true,
      mods: null,
      updateMode: false,
      fileDialog: false,
      server: {
        id: null,
        name: null,
        image: null,
        icon: null,
        version: null,
        slogan: null,
        description: null,
        content: null,
        query: {
          host: null,
          port: null,
        },
        mods: [],
      },
      serverDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.serverDialog = false
    this.fileDialog = false
    this.servers = await this.$axios.get('/servers').then((res) => res.data)
    this.loading = false
  },
  mounted() {
    // this.socket.on("servers/online", (payload) => {
    //   console.log(payload)
    // });
  },
  methods: {
    async searchMod(event) {
      this.mods = await this.$axios
        .get('/servers/mods', {
          params: {
            search: event.query,
          },
        })
        .then((res) => res.data.data)
    },
    hideDialog() {
      this.serverDialog = false
    },
    async uploadMedia(event, type) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$axios.patch(`/servers/${type}/${this.server.id}`, formData, {
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
    async openFileDialog(server) {
      this.server = this.$_.pick(await this.$axios.get('/servers/' + server.id).then((res) => res.data), this.$_.deepKeys(this.server))
      this.fileDialog = true
    },
    async removeMedia(type) {
      try {
        await this.$axios.delete(`/servers/${type}/${this.server.id}`)
        this.$toast.add({
          severity: 'success',
          detail: 'Медиа успешно удалена',
          life: 3000,
        })
        await this.$fetch()
      } catch {}
    },
    async openDialog(server = null) {
      this.updateMode = !!server
      if (server) {
        this.server = this.$_.pick(await this.$axios.get('/servers/' + server.id).then((res) => res.data), this.$_.deepKeys(this.server))
      } else {
        this.server = {
          id: null,
          name: null,
          image: null,
          icon: null,
          version: null,
          slogan: null,
          description: null,
          content: null,
          query: {
            host: null,
            port: null,
          },
          mods: [],
        }
      }
      this.serverDialog = true
    },
    async createServer() {
      this.loading = true
      try {
        await this.$axios.post('/servers', {
          ...this.server,
          mods: this.server.mods.map((mod) => mod.id),
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Сервер успешно добавлен',
          life: 3000,
        })
        await this.$fetch()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: 'Сервер с данным ID уже присутствует',
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
    async updateServer() {
      this.loading = true
      try {
        await this.$axios.patch('/servers/' + this.server.id, {
          ...this.$_(this.server).omitBy(this.$_.isEmpty).omit('id').value(),
          mods: this.server.mods.map((mod) => mod.id),
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Сервер успешно редактирован',
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
    async removeServer(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/servers/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Сервер успешно удален',
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
