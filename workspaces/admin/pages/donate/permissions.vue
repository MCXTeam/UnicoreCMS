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
          :value="permissions"
          :loading="loading"
          :rows="20"
          paginator
          v-model:filters="filters"
          rowHover
          responsiveLayout="scroll"
          v-model:selection="selected"
          @row-reorder="onPermsReorder"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление донат-правами</h5>
            </div>
          </template>
          <Column :styles="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
          <Column selectionMode="multiple" :styles="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :styles="{ width: '8rem' }"></Column>
          <Column field="name" header="Название"></Column>
          <Column field="price" header="Цена">
            <template #body="slotProps">
              {{ $utils.formatCurrency('real', slotProps.data.price) }}
            </template>
          </Column>
          <Column field="sale" header="Скидка"></Column>
          <Column field="type" header="Тип">
            <template #body="slotProps">
              {{ types.find((type) => type.value == slotProps.data.type).name }}
            </template>
          </Column>
          <Column field="servers" header="Серверы" filterField="servers" :showFilterMatchModes="false">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-for="server in slotProps.data.servers" :key="server.id" :value="server.name"></Tag>
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removePermission(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="permissionDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование права"
            class="p-fluid"
          >
            <VeeField
              v-model="permission.name"
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
              v-model="permission.type"
              name="type"
              label="Тип"
              rules="required"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>Тип</label>
                <Select
                  :modelValue="value"
                  @update:modelValue="handleChange"
                  @blur="handleBlur"
                  :options="types"
                  optionLabel="name"
                  appendTo="body"
                  :class="errorMessage && 'p-invalid'"
                />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <div class="field">
              <label>Доступные периоды</label>
              <MultiSelect
                v-model="permission.periods"
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
              <label>Описание</label>
              <Editor v-model="permission.description" editorStyle="height: 220px">
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
            <div class="grid">
              <div class="col-6">
                <VeeField
                  v-model="permission.price"
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
                  v-model="permission.sale"
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
                v-model="permission.virtual_percent"
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
                  @blur="handleBlur"
                  :class="errorMessage && 'p-invalid'"
                />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                <small>0 - отключить оплату бонусами на данный товар</small>
              </VeeField>
            </div>
            <div class="field" v-if="$_.get(permission.type, 'value') == 'game' || $_.get(permission.type, 'value') == 'kit'">
              <label>Серверы</label>
              <MultiSelect
                v-model="permission.servers"
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
            <div class="field" v-if="$_.get(permission.type, 'value') == 'game' || $_.get(permission.type, 'value') == 'kit'">
              <label>Права</label>
              <InputChips v-model="permission.perms" placeholder="Выберите разрешения" />
            </div>
            <div class="field" v-if="$_.get(permission.type, 'value') == 'web'">
              <label>Веб-права</label>
              <AutoComplete
                v-model="permission.web_perms"
                :multiple="true"
                :suggestions="autocompleateFilterd"
                @complete="searchAutocompleate($event)"
                appendTo="body"
                :completeOnFocus="true"
                placeholder="Выберите разрешения"
              />
            </div>
            <div class="field" v-if="$_.get(permission.type, 'value') == 'kit'">
              <label>Связанные киты</label>
              <MultiSelect
                v-model="permission.kits"
                display="chip"
                :filter="true"
                :options="kits"
                optionLabel="name"
                placeholder="Выберите киты"
                class="p-column-filter"
                appendTo="body"
              ></MultiSelect>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updatePermission() : createPermission()"
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
    useHead({ title: 'Донат-права' })
    const config = useRuntimeConfig()
    return {
      apiUrl: config.public.apiBaseurl,
      realDecimals: config.public.realDecimals,
    }
  },
  data() {
    return {
      permissions: null,
      loading: true,
      selected: null,
      updateMode: false,
      permission: {
        id: null,
        name: null,
        description: null,
        price: null,
        sale: null,
        type: null,
        servers: [],
        kits: [],
        periods: [],
        perms: [],
        web_perms: [],
        virtual_percent: false,
      },
      permissionDialog: false,
      types: [
        { name: 'Игровые пермишены', value: 'game' },
        { name: 'Веб-пермишены', value: 'web' },
        { name: 'Киты', value: 'kit' },
      ],
      autocompleate: null,
      autocompleateFilterd: null,
      servers: null,
      periods: null,
      kits: null,
      filters: null,
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.permissionDialog = false
      this.permissions = await this.$api.get('/donates/permissions').then((res) => res.data)
      this.kits = await this.$api.get('/donates/group-kits').then((res) => res.data)
      this.periods = await this.$api.get('/donates/periods').then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)
      this.autocompleate = await this.$api.get('/admin/roles/autocompleate').then((res) => res.data)
      this.loading = false
    },
    async onPermsReorder(event) {
      this.loading = true
      await this.$api.post('/donates/permissions/sort', {
        items: event.value.map((p, priority) => ({
          id: p.id,
          priority,
        })),
      })
      this.load()
    },
    searchAutocompleate(event) {
      if (!event.query.trim().length) {
        this.autocompleateFilterd = this.autocompleate
      } else {
        this.autocompleateFilterd = [
          event.query.toLowerCase(),
          ...this.autocompleate.filter((perm) => {
            return perm.toLowerCase().includes(event.query.toLowerCase())
          }),
        ]

        if (this.autocompleateFilterd.length === 0) {
          this.autocompleateFilterd = [event.query.toLowerCase()]
        }
      }
    },
    hideDialog() {
      this.permissionDialog = false
    },
    async openDialog(permission = null) {
      this.updateMode = !!permission
      if (permission) {
        this.permission = this.$_.pick(
          await this.$api.get('/donates/permissions/' + permission.id).then((res) => res.data),
          this.$_.deepKeys(this.permission),
        )
        this.permission.type = this.types.find((type) => type.value == this.permission.type)
      } else {
        this.permission = {
          id: null,
          name: null,
          description: null,
          price: null,
          sale: null,
          type: 'game',
          servers: [],
          kits: [],
          periods: [],
          perms: [],
          web_perms: [],
          virtual_percent: false,
        }
      }
      this.permissionDialog = true
    },
    async createPermission() {
      this.loading = true
      try {
        await this.$api.post('/donates/permissions', {
          ...this.permission,
          type: this.permission.type.value,
          kits: this.permission.kits.map((kit) => kit.id),
          periods: this.permission.periods.map((period) => period.id),
          servers: this.permission.servers.map((server) => server.id),
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Право успешно добавлена',
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
    async updatePermission() {
      this.loading = true
      try {
        await this.$api.patch('/donates/permissions/' + this.permission.id, {
          ...this.$_.omit(this.permission, 'id'),
          type: this.permission.type.value,
          kits: this.permission.kits.map((kit) => kit.id),
          periods: this.permission.periods.map((period) => period.id),
          servers: this.permission.servers.map((server) => server.id),
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Право успешно редактировано',
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
            await this.$api.delete('/donates/permissions/bulk/', {
              data: {
                items: this.selected.map((permission) => permission.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Права успешно удалены',
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async removePermission(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/permissions/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Право успешно удалено',
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
