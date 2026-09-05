<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button v-if="canCreate" :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
            </div>
          </template>
          <template v-slot:end>
            <div class="my-2">
              <Button
                v-if="canIssue"
                :label="$t('admin.rcon_issuance')"
                icon="pi pi-cog"
                class="p-button-help"
                @click="rconSettingsDialog = true"
              />
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
          <Column v-if="canSort" :style="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
          <Column field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column field="name" :header="$t('admin.name')">
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
                v-if="canUpdateOn(slotProps.data.id)"
                @click="openDialog(slotProps.data)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success mr-2"
              />
              <Button
                v-if="canUpdateOn(slotProps.data.id)"
                @click="openFileDialog(slotProps.data)"
                icon="pi pi-images"
                class="p-button-rounded p-button-secondary mr-2"
              />
              <Button
                @click="removeServer(slotProps.data.id)"
                v-if="canDelete && !slotProps.data.important"
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
              <IconAvatar :path="server.icon" size="xlarge" />
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
          <label>{{ $t('admin.server_gallery') }}</label>
          <div class="grid mb-2 pt-2">
            <div class="col-12">
              <div v-if="gallery.length" class="flex flex-wrap gap-3 mb-3">
                <div v-for="image in gallery" :key="image.id" class="gallery-item">
                  <Image width="140" :src="`${apiUrl + '/' + image.file}`" preview />
                  <Button
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-danger p-button-sm mt-2"
                    @click="removeGalleryImage(image.id)"
                  />
                </div>
              </div>
              <span v-else class="text-color-secondary">{{ $t('admin.server_gallery_empty') }}</span>
            </div>
            <div class="col-12">
              <Button :label="$t('admin.upload')" icon="pi pi-upload" @click="$refs.galleryInput.choose()" />
              <FileUpload
                ref="galleryInput"
                :pt="{ root: { class: 'hidden' } }"
                mode="basic"
                name="file"
                accept="image/*"
                :auto="true"
                :customUpload="true"
                @uploader="uploadGalleryImage($event)"
              />
            </div>
          </div>
        </Dialog>

        <VeeForm v-slot="{ meta }">
          <SectionedDialog
            ref="dialog"
            v-model:visible="serverDialog"
            v-model="section"
            :sections="sections"
            :header="$t('admin.server_dialog')"
            width="640px"
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
                      <label>ID<span class="p-error"> *</span></label>
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
                      <label>{{ $t('admin.version') }}<span class="p-error"> *</span></label>
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
                  <div class="field-checkbox">
                    <Checkbox :binary="true" inputId="server_wipe" v-model="server.wipe" />
                    <label for="server_wipe" class="flex align-items-center gap-1">
                      {{ $t('admin.server_wipe') }}
                      <i v-tooltip.right="$t('admin.server_wipe_hint')" class="pi pi-question-circle text-color-secondary" />
                    </label>
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
                          <IconAvatar :path="slotProps.option.icon" />
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
              </div>
            </template>

            <template #table>
              <div class="grid">
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
              </div>
            </template>

            <template #query>
              <div class="grid">
                <div class="col-12 md:col-6">
                  <VeeField
                    v-model="server.query.host"
                    name="query_host"
                    :label="$t('admin.query_host')"
                    rules="required"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.query_host') }}<span class="p-error"> *</span></label>
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
                      <label>{{ $t('admin.query_port') }}<span class="p-error"> *</span></label>
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
              </div>
            </template>

            <template #issuance>
              <div class="grid">
                <div class="col-12">
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
                      <label>{{ $t('admin.rcon_host') }}<FieldLock :allowed="canEditRcon(updateMode)" /></label>
                      <InputText
                        v-model="server.rcon.host"
                        placeholder="127.0.0.1"
                        :disabled="!canEditRcon(updateMode)"
                        @update:modelValue="rconTest.ok = null"
                      />
                    </div>
                  </div>
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label>{{ $t('admin.rcon_port') }}<FieldLock :allowed="canEditRcon(updateMode)" /></label>
                      <InputNumber
                        :disabled="!canEditRcon(updateMode)"
                        v-model="server.rcon.port"
                        :useGrouping="false"
                        placeholder="25575"
                        @update:modelValue="rconTest.ok = null"
                      />
                    </div>
                  </div>
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label>{{ $t('admin.rcon_password') }}<FieldLock :allowed="canEditRcon(updateMode)" /></label>
                      <Password
                        v-model="server.rcon.password"
                        :disabled="!canEditRcon(updateMode)"
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
                  <div class="col-12" v-if="updateMode && canRconOn(server.id)">
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
                @click="updateMode ? updateServer() : createServer()"
              />
            </template>
          </SectionedDialog>
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
    const access = useAccess({
      canCreate: 'panel.servers.create',
      canUpdate: 'panel.servers.update',
      canDelete: 'panel.servers.delete',
      canRcon: 'panel.servers.rcon',
      canIssue: 'panel.servers.issuance',
      canSort: 'panel.servers.sort',
    })

    const scoped = useScopedAccess({
      canUpdateOn: 'panel.servers.update',
      canRconOn: 'panel.servers.rcon',
    })

    const fields = useFieldAccess('server', {
      canEditRcon: 'rcon',
    })

    return { translations, apiUrl: config.public.apiBaseurl, ...access, ...scoped, ...fields }
  },
  data() {
    return {
      servers: null,
      loading: true,
      mods: null,
      updateMode: false,
      fileDialog: false,
      gallery: [],
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
        wipe: false,
        rcon: {
          host: null,
          port: null,
          password: null,
        },
        mods: [],
      },
      serverDialog: false,
      section: 'main',
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  computed: {
    sections() {
      const isDefault = this.translations.isDefault

      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle', hidden: !isDefault },
        { key: 'table', label: 'admin.section_table', icon: 'pi pi-table', hidden: !isDefault },
        { key: 'query', label: 'admin.section_query', icon: 'pi pi-sitemap', hidden: !isDefault },
        { key: 'issuance', label: 'admin.section_issuance', icon: 'pi pi-send', hidden: !isDefault },
        { key: 'translation', label: 'admin.section_translation', icon: 'pi pi-language', hidden: isDefault },
      ]
    },
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
      return (this.server.instances || []).map((instance, priority) => ({
        name: instance.name,
        host: instance.host,
        port: instance.port || null,
        priority,
      }))
    },
    instancesIncomplete() {
      const incomplete = (this.server.instances || []).some((instance) => !instance.name || !instance.host)

      if (incomplete)
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.instances_incomplete'),
          life: 3000,
        })

      return incomplete
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

      await this.loadGallery()
    },
    async loadGallery() {
      this.gallery = await this.$api.get(`/servers/${this.server.id}/gallery`).then((res) => res.data)
    },
    async uploadGalleryImage(event) {
      const formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.post(`/servers/${this.server.id}/gallery`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        await this.loadGallery()
      } catch {
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.images_only'),
          life: 3000,
        })
      }
    },
    async removeGalleryImage(id) {
      try {
        await this.$api.delete(`/servers/${this.server.id}/gallery/${id}`)
        await this.loadGallery()
      } catch {}
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
        this.server.wipe = !!this.server.wipe
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
          wipe: false,
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
      if (this.instancesIncomplete()) return

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
      if (this.instancesIncomplete()) return

      this.loading = true
      try {
        const payload = {
          ...this.$_(this.server).omitBy(this.$_.isEmpty).omit('id').value(),
          delivery_mode: this.server.delivery_mode,
          wipe: this.server.wipe,
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
