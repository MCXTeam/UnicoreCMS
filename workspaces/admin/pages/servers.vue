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
          <template v-slot:end>
            <div class="my-2">
              <Button label="Выдача (RCON)" icon="pi pi-cog" class="p-button-help" @click="rconSettingsDialog = true" />
            </div>
          </template>
        </Toolbar>

        <DataTable
          :value="servers"
          :loading="loading"
          v-model:filters="filters"
          @row-reorder="onServersReorder"
          rowHover
          responsiveLayout="scroll"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление серверами</h5>
            </div>
          </template>
          <Column :style="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
          <Column field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column field="name" header="Название">
            <template #body="slotProps">
              <div class="flex align-items-center">
                <Avatar v-if="slotProps.data.icon" :image="`${apiUrl + '/' + slotProps.data.icon}`" shape="circle" />
                <Avatar v-else icon="pi pi-image" shape="circle" />
                <span class="ml-2">{{ slotProps.data.name }}</span>
              </div>
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
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

        <Dialog v-model:visible="fileDialog" :style="{ width: '600px' }" :modal="true" header="Редактирование медиа" class="p-fluid">
          <label>Иконка сервера</label>
          <div class="grid mb-4 pt-2">
            <div class="col-6">
              <Avatar v-if="server.icon" :image="`${apiUrl + '/' + server.icon}`" size="xlarge" shape="circle" />
              <Avatar v-else icon="pi pi-image" size="xlarge" shape="circle" />
            </div>
            <div class="col-6">
              <div class="field mb-0 mt-2">
                <Button label="Загрузить" icon="pi pi-upload" @click="$refs.iconInput.choose()" />
                <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeMedia('icon')" />
                <FileUpload
                  ref="iconInput"
                  :pt="{ root: { class: 'hidden' } }"
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
              <Image v-else width="200" :src="`${apiUrl + '/' + server.image}`" preview />
            </div>
            <div class="col-12 md:col-6">
              <div class="field mb-0 mt-2">
                <Button label="Загрузить" icon="pi pi-upload" @click="$refs.imageInput.choose()" />
                <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeMedia('image')" />
                <FileUpload
                  ref="imageInput"
                  :pt="{ root: { class: 'hidden' } }"
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

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="serverDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование сервера"
            class="p-fluid"
          >
            <div class="grid">
              <div class="col-12 md:col-6">
                <VeeField
                  v-model="server.id"
                  name="id"
                  label="ID (a-z)"
                  :rules="{
                    required: true,
                    regex: /^[a-z1-9]+$/,
                  }"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>ID</label>
                    <InputText
                      :disabled="updateMode"
                      :modelValue="value"
                      @update:modelValue="handleChange"
                      @blur="handleBlur"
                      :class="errorMessage && 'p-invalid'"
                      autofocus
                    />
                    <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  </div>
                </VeeField>
              </div>
              <div class="col-12 md:col-6">
                <VeeField
                  v-model="server.name"
                  name="name"
                  label="Название"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>Название</label>
                    <InputText
                      :modelValue="value"
                      @update:modelValue="handleChange"
                      @blur="handleBlur"
                      :class="errorMessage && 'p-invalid'"
                    />
                    <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  </div>
                </VeeField>
              </div>
              <div class="col-12">
                <VeeField
                  v-model="server.version"
                  name="version"
                  label="Версия"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>Версия</label>
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
                    optionLabel="name"
                    appendTo="body"
                    placeholder="Выберите моды"
                  >
                    <template #option="slotProps">
                      <div class="flex align-items-center">
                        <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                        <Avatar v-else icon="pi pi-image" shape="circle" />
                        <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
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
                        <button class="ql-link"></button>
                        <button class="ql-image"></button>
                      </span>
                    </template>
                  </Editor>
                </div>
                <div class="field">
                  <label>Описание (meta-description)</label>
                  <Textarea v-model="server.description" :autoResize="true" />
                </div>
              </div>
              <div class="col-12">
                <div class="field">
                  <label>Характеристики (построение таблицы)</label>
                  <Button @click="addRow" icon="pi pi-plus" class="p-button-rounded p-button-text" />
                  <DataTable
                    :value="server.table"
                    @row-reorder="onRowReorder"
                    editMode="row"
                    v-model:editingRows="table"
                    @row-edit-save="onRowEditSave"
                    responsiveLayout="scroll"
                  >
                    <Column :style="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
                    <Column field="title" header="Заголовок" :style="{ width: '40%' }">
                      <template #editor="slotProps">
                        <InputText v-model="slotProps.data[slotProps.field]" />
                      </template>
                    </Column>
                    <Column field="description" header="Описание" :style="{ width: '50%' }">
                      <template #editor="slotProps">
                        <Textarea v-model="slotProps.data[slotProps.field]" :autoResize="true" />
                      </template>
                    </Column>
                    <Column
                      :rowEditor="true"
                      :style="{ width: '10%', 'min-width': '8rem' }"
                      :bodyStyle="{ 'text-align': 'right' }"
                    ></Column>
                    <Column v-if="!table || !table.length" :style="{ width: '3rem' }" :bodyStyle="{ 'text-align': 'center' }">
                      <template #body="slotProps">
                        <Button
                          @click="removeRow(slotProps.index)"
                          icon="pi pi-trash"
                          class="p-button-rounded p-button-text p-button-danger"
                        />
                      </template>
                    </Column>
                  </DataTable>
                </div>
              </div>
              <div class="col-12 md:col-6">
                <VeeField
                  v-model="server.query.host"
                  name="query_host"
                  label="Query хост"
                  rules="required"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>Query хост</label>
                    <InputText
                      :modelValue="value"
                      @update:modelValue="handleChange"
                      @blur="handleBlur"
                      :class="errorMessage && 'p-invalid'"
                    />
                    <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  </div>
                </VeeField>
              </div>
              <div class="col-12 md:col-6">
                <VeeField
                  v-model="server.query.port"
                  name="query_port"
                  label="Query порт"
                  rules="required|min_value:0|max_value:65535"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>Query порт</label>
                    <InputNumber
                      :useGrouping="false"
                      :modelValue="value"
                      @update:modelValue="handleChange"
                      @input="handleChange($event.value)"
                      @blur="handleBlur"
                      :class="errorMessage && 'p-invalid'"
                    />
                    <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  </div>
                </VeeField>
              </div>
              <div class="col-12">
                <Divider align="left"><span class="font-medium">Способ выдачи</span></Divider>
                <div class="field">
                  <label>Как выдавать товары и привилегии</label>
                  <Select v-model="server.delivery_mode" :options="deliveryModes" optionLabel="label" optionValue="value" appendTo="body" />
                  <small class="text-color-secondary">
                    RCON — CMS сама подключается к серверу и выполняет команды по шаблонам. Плагин — выдача через склад UnicoreConnect.
                  </small>
                </div>
              </div>
              <template v-if="server.delivery_mode === 1">
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label>RCON хост</label>
                    <InputText v-model="server.rcon.host" placeholder="127.0.0.1" @update:modelValue="rconTest.ok = null" />
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label>RCON порт</label>
                    <InputNumber
                      v-model="server.rcon.port"
                      :useGrouping="false"
                      placeholder="25575"
                      @update:modelValue="rconTest.ok = null"
                    />
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="field">
                    <label>RCON пароль</label>
                    <Password
                      v-model="server.rcon.password"
                      :feedback="false"
                      toggleMask
                      inputClass="w-full"
                      placeholder="Оставьте пустым, чтобы не менять"
                      @update:modelValue="rconTest.ok = null"
                    />
                  </div>
                </div>
                <div class="col-12 md:col-6 flex align-items-end">
                  <div class="field w-full">
                    <Button
                      label="Проверить соединение"
                      icon="pi pi-bolt"
                      class="p-button-secondary w-full"
                      :loading="rconTest.loading"
                      @click="testRcon"
                    />
                    <Tag
                      v-if="rconTest.ok !== null"
                      class="mt-2"
                      :severity="rconTest.ok ? 'success' : 'danger'"
                      :value="rconTest.message"
                    />
                  </div>
                </div>
                <div class="col-12" v-if="updateMode">
                  <Button label="Очередь команд" icon="pi pi-list" class="p-button-outlined p-button-secondary" @click="openRconQueue" />
                </div>
              </template>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateServer() : createServer()"
              />
            </template>
          </Dialog>
        </VeeForm>

        <RconIssuanceDialog v-model:visible="rconSettingsDialog" />
        <RconQueue v-model:visible="rconQueueDialog" :serverId="server.id" />
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
    useHead({ title: 'Серверы' })
    const config = useRuntimeConfig()
    return { apiUrl: config.public.apiBaseurl }
  },
  data() {
    return {
      actions: [
        {
          label: 'Редактировать',
          icon: 'pi pi-pencil',
          command: () => {
            this.$toast.add({ severity: 'success', summary: 'Update', detail: 'Data Updated' })
          },
        },
        {
          label: 'Удалить',
          icon: 'pi pi-trash',
          command: () => {
            this.$toast.add({ severity: 'error', summary: 'Delete', detail: 'Data Deleted' })
          },
        },
        {
          label: 'Изменить иконку',
          icon: 'pi pi-images',
          command: () => {
            window.location.hash = '/fileupload'
          },
        },
      ],
      servers: null,
      loading: true,
      mods: null,
      updateMode: false,
      fileDialog: false,
      table: [],
      deliveryModes: [
        { label: 'Плагин (UnicoreConnect)', value: 0 },
        { label: 'RCON (CMS выполняет команды)', value: 1 },
      ],
      rconSettingsDialog: false,
      rconQueueDialog: false,
      rconTest: { loading: false, ok: null, message: null },
      server: {
        id: null,
        name: null,
        image: null,
        icon: null,
        version: null,
        slogan: null,
        description: null,
        content: null,
        table: [],
        query: {
          host: null,
          port: null,
        },
        delivery_mode: 0,
        rcon: {
          host: null,
          port: null,
          password: null,
        },
        mods: [],
      },
      serverDialog: false,
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
      this.serverDialog = false
      this.fileDialog = false
      this.servers = await this.$api.get('/servers').then((res) => res.data)
      this.loading = false
    },
    async onServersReorder(event) {
      this.loading = true
      await this.$api.post('/servers/sort', {
        items: event.value.map((serv, priority) => ({
          id: serv.id,
          priority,
        })),
      })
      this.load()
    },
    onRowReorder(event) {
      this.server.table = event.value
    },
    onRowEditSave(event) {
      let { newData, index } = event
      this.server.table[index] = newData
    },
    addRow() {
      this.server.table.push({
        title: null,
        description: null,
      })
    },
    removeRow(index) {
      this.server.table.splice(index, 1)
      this.table = []
    },
    async searchMod(event) {
      this.mods = await this.$api
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
        await this.$api.patch(`/servers/${type}/${this.server.id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Иконка успешно обновлена',
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
    async openFileDialog(server) {
      this.server = this.$_.pick(await this.$api.get('/servers/' + server.id).then((res) => res.data), this.$_.deepKeys(this.server))
      this.fileDialog = true
    },
    async removeMedia(type) {
      try {
        await this.$api.delete(`/servers/${type}/${this.server.id}`)
        this.$toast.add({
          severity: 'success',
          detail: 'Медиа успешно удалена',
          life: 3000,
        })
        await this.load()
      } catch {}
    },
    async openDialog(server = null) {
      this.updateMode = !!server
      this.rconTest = { loading: false, ok: null, message: null }
      if (server) {
        this.server = this.$_.pick(
          await this.$api.get('/servers/' + server.id + '/admin').then((res) => res.data),
          this.$_.deepKeys(this.server),
        )
        if (!this.server.table) this.server.table = []
        if (!this.server.rcon) this.server.rcon = { host: null, port: null, password: null }
        if (this.server.delivery_mode == null) this.server.delivery_mode = 0
      } else {
        this.server = {
          id: null,
          name: null,
          image: null,
          icon: null,
          version: null,
          slogan: null,
          table: [],
          description: null,
          content: null,
          query: {
            host: null,
            port: null,
          },
          delivery_mode: 0,
          rcon: {
            host: null,
            port: null,
            password: null,
          },
          mods: [],
        }
      }
      this.serverDialog = true
    },
    async createServer() {
      this.loading = true
      try {
        const payload = {
          ...this.server,
          delivery_mode: this.server.delivery_mode,
          table: this.server.table && this.server.table.length ? this.server.table.map((row, priority) => ({ ...row, priority })) : [],
          mods: this.server.mods.map((mod) => mod.id),
        }
        if (this.server.delivery_mode !== 1) delete payload.rcon
        await this.$api.post('/servers', payload)
        this.$toast.add({
          severity: 'success',
          detail: 'Сервер успешно добавлен',
          life: 3000,
        })
        await this.load()
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
        const payload = {
          ...this.$_(this.server).omitBy(this.$_.isEmpty).omit('id').value(),
          delivery_mode: this.server.delivery_mode,
          table: this.server.table && this.server.table.length ? this.server.table.map((row, priority) => ({ ...row, priority })) : [],
          mods: this.server.mods.map((mod) => mod.id),
        }
        if (this.server.delivery_mode === 1) {
          payload.rcon = this.server.rcon
        } else {
          delete payload.rcon
        }
        await this.$api.patch('/servers/' + this.server.id, payload)
        this.$toast.add({
          severity: 'success',
          detail: 'Сервер успешно редактирован',
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
    async testRcon() {
      if (!this.server.id) {
        this.rconTest = { loading: false, ok: false, message: 'Сначала сохраните сервер' }
        return
      }
      this.rconTest = { loading: true, ok: null, message: null }
      try {
        const res = await this.$api.post(`/rcon/${this.server.id}/test`).then((r) => r.data)
        this.rconTest = { loading: false, ok: res.ok, message: res.ok ? 'Соединение успешно' : res.error || 'Ошибка соединения' }
      } catch {
        this.rconTest = { loading: false, ok: false, message: 'Ошибка соединения' }
      }
    },
    openRconQueue() {
      this.rconQueueDialog = true
    },
    async removeServer(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/servers/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Сервер успешно удален',
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
