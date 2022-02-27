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
          :filters.sync="filters"
          rowHover
          responsiveLayout="scroll"
          :selection.sync="selected"
          dataKey="id"
          filterDisplay="menu"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление донат-правами</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :styles="{ width: '3rem' }"></Column>
          <Column sortable field="id" header="ID" :styles="{ width: '8rem' }"></Column>
          <Column field="name" header="Название" sortable></Column>
          <Column field="type" header="Тип" sortable>
            <template #body="slotProps">
              {{ types.find((type) => type.value == slotProps.data.type).name }}
            </template>
          </Column>
          <Column field="servers" header="Серверы" filterField="servers" :showFilterMatchModes="false">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-for="server in slotProps.data.servers" :key="server.id" :value="server.name"></Tag>
            </template>
            <template #filter="{ filterModel }">
              <div class="mb-3 font-bold">Серверы</div>
              <MultiSelect
                display="chip"
                :filter="true"
                v-model="filterModel.value"
                :options="servers"
                optionLabel="name"
                placeholder="Выберите серверы"
                class="p-column-filter"
              >
                <template #option="slotProps">
                  <div class="p-multiselect-representative-option">
                    <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </MultiSelect>
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removePermission(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="permissionDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование права"
            class="p-fluid"
          >
            <ValidationProvider name="Название" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Название</label>
                <InputText v-model="permission.name" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Тип" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Тип</label>
                <Dropdown v-model="permission.type" :options="types" optionLabel="name" appendTo="body" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
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
                  </span>
                </template>
              </Editor>
            </div>
            <div class="grid">
              <div class="col-6">
                <ValidationProvider name="Цена" rules="required|min:0.01" v-slot="{ errors }">
                  <div class="field">
                    <label>Цена</label>
                    <InputNumber v-model="permission.price" currency="RUB" locale="ru-RU" mode="currency" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
              <div class="col-6">
                <ValidationProvider name="Скидка" rules="min_value:0|max_value:99" v-slot="{ errors }">
                  <div class="field">
                    <label>Скидка</label>
                    <InputNumber suffix=" %" :useGrouping="false" v-model="permission.sale" />
                    <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                  </div>
                </ValidationProvider>
              </div>
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
                    <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field" v-if="$_.get(permission.type, 'value') == 'game' || $_.get(permission.type, 'value') == 'kit'">
              <label>Права</label>
              <Chips v-model="permission.perms" placeholder="Выберите разрешения" />
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
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updatePermission() : createPermission()"
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
    title: 'Донат-права',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
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
      },
      permissionDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        servers: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
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
    }
  },
  async fetch() {
    this.loading = true
    this.permissionDialog = false
    this.permissions = await this.$axios.get('/donates/permissions').then((res) => res.data)
    this.kits = await this.$axios.get('/donates/group-kits').then((res) => res.data)
    this.periods = await this.$axios.get('/donates/periods').then((res) => res.data)
    this.servers = await this.$axios.get('/servers').then((res) => res.data)
    this.autocompleate = await this.$axios.get('/admin/roles/autocompleate').then((res) => res.data)
    this.loading = false
  },
  methods: {
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
          await this.$axios.get('/donates/permissions/' + permission.id).then((res) => res.data),
          this.$_.deepKeys(this.permission)
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
        }
      }
      this.permissionDialog = true
    },
    async createPermission() {
      this.loading = true
      try {
        await this.$axios.post('/donates/permissions', {
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
    async updatePermission() {
      this.loading = true
      try {
        await this.$axios.patch('/donates/permissions/' + this.permission.id, {
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
    async removeMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/donates/permissions/bulk/', {
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
          await this.$fetch()
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
            await this.$axios.delete('/donates/permissions/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Право успешно удалено',
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
