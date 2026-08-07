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
          <template v-slot:end>
            <div class="my-2">
              <Button :label="$t('admin.rcon_issuance')" icon="pi pi-cog" class="p-button-help" @click="rconSettingsDialog = true" />
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
              <h5 class="m-0">{{ $t('admin.servers_title') }}</h5>
            </div>
          </template>
          <Column :style="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
          <Column field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column field="name" :header="$t('admin.name')">
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

        <Dialog v-model:visible="fileDialog" :style="{ width: '600px' }" :modal="true" :header="$t('admin.media_dialog')" class="p-fluid">
          <label>{{ $t('admin.server_icon') }}</label>
          <div class="grid mb-4 pt-2">
            <div class="col-6">
              <Avatar v-if="server.icon" :image="`${apiUrl + '/' + server.icon}`" size="xlarge" shape="circle" />
              <Avatar v-else icon="pi pi-image" size="xlarge" shape="circle" />
            </div>
            <div class="col-6">
              <div class="field mb-0 mt-2">
                <Button :label="$t('admin.upload')" icon="pi pi-upload" @click="$refs.iconInput.choose()" />
                <Button :label="$t('admin.delete')" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeMedia('icon')" />
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
          <label>{{ $t('admin.server_image') }}</label>
          <div class="grid mb-4 pt-2">
            <div class="col-12 md:col-6">
              <Avatar v-if="!server.image" icon="pi pi-image" size="xlarge" />
              <Image v-else width="200" :src="`${apiUrl + '/' + server.image}`" preview />
            </div>
            <div class="col-12 md:col-6">
              <div class="field mb-0 mt-2">
                <Button :label="$t('admin.upload')" icon="pi pi-upload" @click="$refs.imageInput.choose()" />
                <Button :label="$t('admin.delete')" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeMedia('image')" />
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
            :header="$t('admin.server_dialog')"
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
                    :label="$t('admin.name')"
                    rules="required"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.name') }}</label>
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
                    :label="$t('admin.version')"
                    rules="required"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.version') }}</label>
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
                    <label>{{ $t('admin.slogan') }}</label>
                    <InputText v-model="server.slogan" />
                  </div>
                  <div class="field">
                    <label>{{ $t('admin.menu_mods') }}</label>
                    <AutoComplete
                      v-model="server.mods"
                      :multiple="true"
                      :suggestions="mods"
                      @complete="searchMod($event)"
                      optionLabel="name"
                      appendTo="body"
                      :placeholder="$t('admin.choose_mods')"
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
                    <label>{{ $t('admin.description') }}</label>
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
                    <label>{{ $t('admin.meta_description') }}</label>
                    <Textarea v-model="server.description" :autoResize="true" />
                  </div>
                </div>
                <div class="col-12">
                  <div class="field">
                    <label>{{ $t('admin.server_table') }}</label>
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
                      <Column field="title" :header="$t('admin.heading')" :style="{ width: '40%' }">
                        <template #editor="slotProps">
                          <InputText v-model="slotProps.data[slotProps.field]" />
                        </template>
                      </Column>
                      <Column field="description" :header="$t('admin.description')" :style="{ width: '50%' }">
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
                    :label="$t('admin.query_host')"
                    rules="required"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.query_host') }}</label>
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
                    :label="$t('admin.query_port')"
                    rules="required|min_value:0|max_value:65535"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.query_port') }}</label>
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
                  <Divider align="left"
                    ><span class="font-medium">{{ $t('admin.instances_divider') }}</span></Divider
                  >
                  <div class="field">
                    <label>{{ $t('admin.instances_label') }}</label>
                    <Button @click="addInstance" icon="pi pi-plus" class="p-button-rounded p-button-text" />
                    <small class="block text-color-secondary mb-2">{{ $t('admin.instances_hint') }}</small>
                    <DataTable
                      :value="server.instances"
                      editMode="row"
                      v-model:editingRows="instances"
                      @row-edit-save="onInstanceEditSave"
                      responsiveLayout="scroll"
                    >
                      <Column field="name" :header="$t('admin.name')" :style="{ width: '40%' }">
                        <template #editor="slotProps">
                          <InputText v-model="slotProps.data[slotProps.field]" placeholder="HiTech 1" />
                        </template>
                      </Column>
                      <Column field="host" :header="$t('admin.host')" :style="{ width: '30%' }">
                        <template #editor="slotProps">
                          <InputText v-model="slotProps.data[slotProps.field]" placeholder="127.0.0.1" />
                        </template>
                      </Column>
                      <Column field="port" :header="$t('admin.port')" :style="{ width: '20%' }">
                        <template #editor="slotProps">
                          <InputNumber v-model="slotProps.data[slotProps.field]" :useGrouping="false" placeholder="25565" />
                        </template>
                      </Column>
                      <Column
                        :rowEditor="true"
                        :style="{ width: '10%', 'min-width': '8rem' }"
                        :bodyStyle="{ 'text-align': 'right' }"
                      ></Column>
                      <Column v-if="!instances || !instances.length" :style="{ width: '3rem' }" :bodyStyle="{ 'text-align': 'center' }">
                        <template #body="slotProps">
                          <Button
                            @click="removeInstance(slotProps.index)"
                            icon="pi pi-trash"
                            class="p-button-rounded p-button-text p-button-danger"
                          />
                        </template>
                      </Column>
                    </DataTable>
                  </div>
                </div>
                <div class="col-12">
                  <Divider align="left"
                    ><span class="font-medium">{{ $t('admin.issuance_divider') }}</span></Divider
                  >
                  <div class="field">
                    <label>{{ $t('admin.issuance_label') }}</label>
                    <Select
                      v-model="server.delivery_mode"
                      :options="deliveryModes"
                      optionLabel="label"
                      optionValue="value"
                      appendTo="body"
                    />
                    <small class="text-color-secondary">{{ $t('admin.issuance_hint') }}</small>
                  </div>
                </div>
                <template v-if="server.delivery_mode === 1">
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label>{{ $t('admin.rcon_host') }}</label>
                      <InputText v-model="server.rcon.host" placeholder="127.0.0.1" @update:modelValue="rconTest.ok = null" />
                    </div>
                  </div>
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label>{{ $t('admin.rcon_port') }}</label>
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
                      <label>{{ $t('admin.rcon_password') }}</label>
                      <Password
                        v-model="server.rcon.password"
                        :feedback="false"
                        toggleMask
                        inputClass="w-full"
                        :placeholder="$t('admin.rcon_password_placeholder')"
                        @update:modelValue="rconTest.ok = null"
                      />
                    </div>
                  </div>
                  <div class="col-12 md:col-6 flex align-items-end">
                    <div class="field w-full">
                      <Button
                        :label="$t('admin.rcon_test')"
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
                    <Button
                      :label="$t('admin.rcon_queue_button')"
                      icon="pi pi-list"
                      class="p-button-outlined p-button-secondary"
                      @click="openRconQueue"
                    />
                  </div>
                </template>
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
    const translations = useContentTranslations('server')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_servers')) })
    const config = useRuntimeConfig()
    return { translations, apiUrl: config.public.apiBaseurl }
  },
  data() {
    return {
      servers: null,
      loading: true,
      mods: null,
      updateMode: false,
      fileDialog: false,
      table: [],
      instances: [],
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
        instances: [],
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
  computed: {
    actions() {
      return [
        {
          label: this.$t('admin.edit'),
          icon: 'pi pi-pencil',
          command: () => {
            this.$toast.add({ severity: 'success', summary: 'Update', detail: 'Data Updated' })
          },
        },
        {
          label: this.$t('admin.delete'),
          icon: 'pi pi-trash',
          command: () => {
            this.$toast.add({ severity: 'error', summary: 'Delete', detail: 'Data Deleted' })
          },
        },
        {
          label: this.$t('admin.change_icon'),
          icon: 'pi pi-images',
          command: () => {
            window.location.hash = '/fileupload'
          },
        },
      ]
    },
    deliveryModes() {
      return [
        { label: this.$t('admin.issuance_plugin'), value: 0 },
        { label: this.$t('admin.issuance_rcon'), value: 1 },
      ]
    },
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
    instancesPayload() {
      return (this.server.instances || [])
        .filter((instance) => instance.name && instance.host)
        .map((instance, priority) => ({ name: instance.name, host: instance.host, port: instance.port || null, priority }))
    },
    onInstanceEditSave(event) {
      const { newData, index } = event
      this.server.instances[index] = newData
    },
    addInstance() {
      this.server.instances.push({
        name: null,
        host: null,
        port: null,
      })
    },
    removeInstance(index) {
      this.server.instances.splice(index, 1)
      this.instances = []
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
    async openFileDialog(server) {
      this.server = this.$_.pick(await this.$api.get('/servers/' + server.id).then((res) => res.data), this.$_.deepKeys(this.server))
      this.fileDialog = true
    },
    async removeMedia(type) {
      try {
        await this.$api.delete(`/servers/${type}/${this.server.id}`)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.media_deleted'),
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
        if (!this.server.instances) this.server.instances = []
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
          instances: [],
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
      this.translations.attach(this.server)
      await this.translations.load(server ? server.id : null)
      this.serverDialog = true
    },
    async createServer() {
      this.loading = true
      try {
        const payload = {
          ...this.server,
          delivery_mode: this.server.delivery_mode,
          table: this.server.table && this.server.table.length ? this.server.table.map((row, priority) => ({ ...row, priority })) : [],
          instances: this.instancesPayload(),
          mods: this.server.mods.map((mod) => mod.id),
        }
        if (this.server.delivery_mode !== 1) delete payload.rcon
        await this.$api.post('/servers', payload)

        await this.translations.save(this.server.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.server_created'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: this.$t('admin.server_id_exists'),
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
    async updateServer() {
      this.loading = true
      try {
        const payload = {
          ...this.$_(this.server).omitBy(this.$_.isEmpty).omit('id').value(),
          delivery_mode: this.server.delivery_mode,
          table: this.server.table && this.server.table.length ? this.server.table.map((row, priority) => ({ ...row, priority })) : [],
          instances: this.instancesPayload(),
          mods: this.server.mods.map((mod) => mod.id),
        }
        if (this.server.delivery_mode === 1) {
          payload.rcon = this.server.rcon
        } else {
          delete payload.rcon
        }
        await this.$api.patch('/servers/' + this.server.id, payload)

        await this.translations.save(this.server.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.server_updated'),
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
    async testRcon() {
      if (!this.server.id) {
        this.rconTest = { loading: false, ok: false, message: this.$t('admin.rcon_save_first') }
        return
      }
      this.rconTest = { loading: true, ok: null, message: null }
      try {
        const res = await this.$api.post(`/rcon/${this.server.id}/test`).then((r) => r.data)
        this.rconTest = {
          loading: false,
          ok: res.ok,
          message: res.ok ? this.$t('admin.rcon_ok') : res.error || this.$t('admin.rcon_error'),
        }
      } catch {
        this.rconTest = { loading: false, ok: false, message: this.$t('admin.rcon_error') }
      }
    },
    openRconQueue() {
      this.rconQueueDialog = true
    },
    async removeServer(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/servers/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.server_deleted'),
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
