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
          :value="groups"
          :loading="loading"
          rowHover
          responsiveLayout="scroll"
          @row-reorder="onGroupReorder"
          v-model:selection="selected"
          dataKey="id"
          filterDisplay="menu"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление донат-группами</h5>
            </div>
          </template>
          <Column :style="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
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
          <Column field="price" header="Цена">
            <template #body="slotProps">
              {{ $utils.formatCurrency('real', slotProps.data.price) }}
            </template>
          </Column>
          <Column field="sale" header="Скидка"></Column>
          <Column field="servers" header="Серверы">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-for="server in slotProps.data.servers" :key="server.id" :value="server.name"></Tag>
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button @click="removeGroup(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="fileDialog" :style="{ width: '400px' }" :modal="true" header="Иконка донат-группы" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <Avatar v-if="group.icon" :image="`${apiUrl + '/' + group.icon}`" size="xlarge" shape="circle" />
            <Avatar v-else icon="pi pi-image" size="xlarge" shape="circle" />
            <div class="field ml-6 mb-0">
              <Button label="Загрузить" icon="pi pi-upload" @click="$refs.fileInput.choose()" />
              <Button label="Удалить" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeIcon()" />
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
            v-model:visible="groupDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование группы"
            class="p-fluid"
          >
            <VeeField
              v-model="group.name"
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
            <VeeField
              v-model="group.ingame_id"
              name="ingame_id"
              label="ID в игре"
              rules="required"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>ID в игре</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" :class="errorMessage && 'p-invalid'" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <div class="field">
              <label>Серверы</label>
              <MultiSelect
                v-model="group.servers"
                display="chip"
                :filter="true"
                :options="servers"
                optionLabel="name"
                placeholder="Выберите серверы"
                class="p-column-filter"
                appendTo="body"
              >
                <template #option="slotProps">
                  <div class="p-multiselect-representative-option">
                    <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field">
              <label>Доступные периоды</label>
              <MultiSelect
                v-model="group.periods"
                display="chip"
                :filter="true"
                :options="periods"
                optionLabel="name"
                placeholder="Выберите периоды"
                class="p-column-filter"
                appendTo="body"
              ></MultiSelect>
            </div>
            <div class="field">
              <label>Киты</label>
              <MultiSelect
                v-model="group.kits"
                display="chip"
                :filter="true"
                :options="kits"
                optionLabel="name"
                dataKey="id"
                placeholder="Выберите киты"
                class="p-column-filter"
                appendTo="body"
              ></MultiSelect>
            </div>
            <div class="field">
              <label>Инжект веб-прав</label>
              <AutoComplete
                v-model="group.web_perms"
                :multiple="true"
                :suggestions="autocompleateFilterd"
                @complete="searchAutocompleate($event)"
                appendTo="body"
                :completeOnFocus="true"
                placeholder="Выберите разрешения"
              />
            </div>
            <div class="field">
              <label>Описание</label>
              <Editor v-model="group.description" editorStyle="height: 220px">
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
              <label>Возможности (построение блока)</label>
              <Button @click="addFeature" icon="pi pi-plus" class="p-button-rounded p-button-text" />
              <DataTable
                :value="group.features"
                editMode="row"
                @row-reorder="onRowReorder"
                v-model:editingRows="features"
                @row-edit-save="onFeatureEditSave"
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
                <Column :rowEditor="true" :style="{ width: '10%', 'min-width': '8rem' }" :bodyStyle="{ 'text-align': 'right' }"></Column>
                <Column v-if="!features || !features.length" :style="{ width: '3rem' }" :bodyStyle="{ 'text-align': 'center' }">
                  <template #body="slotProps">
                    <Button
                      @click="removeFeature(slotProps.index)"
                      icon="pi pi-trash"
                      class="p-button-rounded p-button-text p-button-danger"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
            <div class="grid">
              <div class="col-6">
                <VeeField
                  v-model="group.price"
                  name="price"
                  label="Цена"
                  rules="required|min:0.01"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>Цена</label>
                    <InputNumber
                      :modelValue="value"
                      @update:modelValue="handleChange"
                      @input="handleChange($event.value)"
                      @blur="handleBlur"
                      mode="decimal"
                      :minFractionDigits="realDecimals"
                      :maxFractionDigits="realDecimals"
                      :class="errorMessage && 'p-invalid'"
                    />
                    <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  </div>
                </VeeField>
              </div>
              <div class="col-6">
                <VeeField
                  v-model="group.sale"
                  name="sale"
                  label="Скидка"
                  rules="min_value:0|max_value:99"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>Скидка</label>
                    <InputNumber
                      suffix=" %"
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
            </div>
            <div class="field">
              <VeeField
                v-model="group.virtual_percent"
                name="virtual_percent"
                label="Процент"
                rules="min_value:0|max_value:100"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <label>Индивидуальный процент оплаты бонусами</label>
                <InputNumber
                  suffix=" %"
                  :useGrouping="false"
                  :modelValue="value"
                  @update:modelValue="handleChange"
                  @input="handleChange($event.value)"
                  @blur="handleBlur"
                  :class="errorMessage && 'p-invalid'"
                />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                <small>0 - отключить оплату бонусами на данный товар</small>
              </VeeField>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateGroup() : createGroup()"
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
import { filterDonateWebPerms } from 'unicore-common/validation'
import { donateWebPermSuggestions } from '~/helpers'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    useHead({ title: 'Донат-группы' })
    const config = useRuntimeConfig()
    return {
      apiUrl: config.public.apiBaseurl,
      realDecimals: config.public.realDecimals,
    }
  },
  data() {
    return {
      groups: null,
      loading: true,
      selected: null,
      updateMode: false,
      fileDialog: false,
      group: {
        id: null,
        name: null,
        ingame_id: null,
        description: null,
        price: null,
        icon: null,
        sale: null,
        features: [],
        servers: [],
        web_perms: [],
        kits: [],
        periods: [],
        virtual_percent: null,
      },
      groupDialog: false,
      autocompleate: null,
      autocompleateFilterd: null,
      servers: null,
      periods: null,
      kits: null,
      features: [],
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.groupDialog = false
      this.fileDialog = false
      this.groups = await this.$api.get('/donates/groups').then((res) => res.data)
      this.kits = await this.$api.get('/donates/group-kits').then((res) => res.data)
      this.periods = await this.$api.get('/donates/periods').then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)
      this.autocompleate = await this.$api.get('/admin/roles/autocompleate').then((res) => filterDonateWebPerms(res.data))
      this.loading = false
    },
    async onGroupReorder(event) {
      this.loading = true
      await this.$api.post('/donates/groups/sort', {
        items: event.value.map((g, priority) => ({
          id: g.id,
          priority,
        })),
      })
      this.load()
    },
    onRowReorder(event) {
      this.group.features = event.value
    },
    onFeatureEditSave(event) {
      let { newData, index } = event
      this.group.features[index] = newData
    },
    addFeature() {
      this.group.features.push({
        title: null,
        description: null,
      })
    },
    removeFeature(index) {
      this.group.features.splice(index, 1)
      this.features = []
    },
    searchAutocompleate(event) {
      this.autocompleateFilterd = donateWebPermSuggestions(this.autocompleate, event.query)
    },
    hideDialog() {
      this.groupDialog = false
      this.features = []
    },
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.patch(`/donates/groups/icon/` + this.group.id, formData, {
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
    async removeIcon() {
      try {
        await this.$api.delete(`/donates/groups/icon/` + this.group.id)
        this.$toast.add({
          severity: 'success',
          detail: 'Картинка успешно удалена',
          life: 3000,
        })
        await this.load()
      } catch {}
    },
    async openFileDialog(group) {
      this.group = this.$_.pick(group, this.$_.deepKeys(this.group))
      this.fileDialog = true
    },
    async openDialog(group = null) {
      this.updateMode = !!group
      if (group) {
        this.group = this.$_.pick(await this.$api.get('/donates/groups/' + group.id).then((res) => res.data), this.$_.deepKeys(this.group))
        if (!this.group.features) this.group.features = []
      } else {
        this.group = {
          id: null,
          name: null,
          ingame_id: null,
          description: null,
          icon: null,
          price: null,
          sale: null,
          features: [],
          servers: [],
          web_perms: [],
          kits: [],
          periods: [],
          virtual_percent: null,
        }
      }
      this.groupDialog = true
    },
    async createGroup() {
      this.loading = true
      try {
        await this.$api.post('/donates/groups', {
          ...this.group,
          features:
            this.group.features && this.group.features.length ? this.group.features.map((row, priority) => ({ ...row, priority })) : [],
          kits: this.group.kits.map((kit) => kit.id),
          periods: this.group.periods.map((period) => period.id),
          servers: this.group.servers.map((server) => server.id),
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Группа успешно добавлена',
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
    async updateGroup() {
      this.loading = true
      try {
        await this.$api.patch('/donates/groups/' + this.group.id, {
          ...this.$_.omit(this.group, 'id'),
          features:
            this.group.features && this.group.features.length ? this.group.features.map((row, priority) => ({ ...row, priority })) : [],
          kits: this.group.kits.map((kit) => kit.id),
          periods: this.group.periods.map((period) => period.id),
          servers: this.group.servers.map((server) => server.id),
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Группа успешно редактирована',
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
            await this.$api.delete('/donates/groups/bulk', {
              data: {
                items: this.selected.map((group) => group.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Группы успешно удалены',
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async removeGroup(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/groups/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Группа успешно удалена',
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
