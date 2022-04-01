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
          :value="users.data"
          lazy
          paginator
          :rows="users.meta.itemsPerPage"
          :filters.sync="filters"
          dataKey="uuid"
          :totalRecords="users.meta.totalItems"
          :loading="loading"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          :selection.sync="selected"
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление пользователями</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :styles="{ width: '3rem' }"></Column>
          <Column field="username" header="Имя пользователя" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center">
                <SkinView2D class="rounded" :width="16" :height="16" :skin="slotProps.data.skin" />
                <span class="ml-2">{{ slotProps.data.username }}</span>
              </div>
            </template>
          </Column>
          <Column field="email" header="Email" sortable></Column>
          <Column field="created" header="Дата регистрации" sortable>
            <template #body="slotProps">
              {{ $moment(slotProps.data.created).local().format('MM/DD/YYYY HH:mm:ss') }}
            </template>
          </Column>
          <Column field="roles" header="Роли">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-if="slotProps.data.superuser" value="SuperUser"></Tag>
              <Tag class="mr-2 mb-2" v-for="role in slotProps.data.roles" :key="role.id" :value="role.name"></Tag>
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <nuxt-link :to="`/users/` + slotProps.data.uuid">
                <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              </nuxt-link>
              <Button @click="removeUser(slotProps.data.uuid)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <ValidationObserver v-slot="{ invalid }">
      <Dialog
        :visible.sync="userDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        header="Создание пользователя"
        class="p-fluid"
      >
        <div class="p-fluid">
          <div class="field">
            <ValidationProvider name="Имя пользователя" rules="required|isUsername" v-slot="{ errors }">
              <label>Имя пользователя</label>
              <InputText v-model="user.username" type="text" />
              <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
            </ValidationProvider>
          </div>
          <div class="field">
            <ValidationProvider name="Email" rules="required|email" v-slot="{ errors }">
              <label>Email</label>
              <InputText v-model="user.email" type="text" />
              <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
            </ValidationProvider>
          </div>
          <div class="field-checkbox">
            <Checkbox :binary="true" v-model="user.activated" />
            <label>Активирован (Email)</label>
          </div>
          <h4>Роли и права</h4>
          <div class="field">
            <label>Роли</label>
            <MultiSelect
              display="chip"
              :filter="true"
              v-model="user.roles"
              optionDisabled="important"
              :options="roles"
              optionLabel="name"
              optionValue="id"
              placeholder="Выберите роли"
              class="p-column-filter"
            />
          </div>
          <div class="field">
            <label>Права</label>
            <span class="p-fluid">
              <AutoComplete
                v-model="user.perms"
                :multiple="true"
                :suggestions="autocompleateFilterd"
                @complete="searchAutocompleate($event)"
                appendTo="body"
                :completeOnFocus="true"
                placeholder="Выберите разрешения"
              />
            </span>
          </div>
          <div class="field-checkbox">
            <Checkbox :binary="true" v-model="user.superuser" />
            <label>Суперпользователь</label>
          </div>
          <div class="field">
            <ValidationProvider class="w-100" name="password" rules="required|min:6|max:32" v-slot="{ errors }">
              <label>Пароль</label>
              <InputText autocomplete="false" v-model="user.password" placeholder="Без изменений" type="password" />
              <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
            </ValidationProvider>
          </div>
          <div class="field">
            <ValidationProvider class="w-100" name="Подтверждение пароля" rules="required|confirmed:password" v-slot="{ errors }">
              <label>Подтверждение пароля</label>
              <InputText autocomplete="false" v-model="user.password_confirm" placeholder="Без изменений" type="password" />
              <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
            </ValidationProvider>
          </div>
        </div>
        <template #footer>
          <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
          <Button :disabled="loading || invalid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="createUser()" />
        </template>
      </Dialog>
    </ValidationObserver>
  </div>
</template>

<script>
import { sortTransform } from '~/helpers'
import { FilterMatchMode } from 'primevue/api'

export default {
  head: {
    title: 'Пользователи',
  },
  data() {
    return {
      users: {
        data: null,
        meta: {
          itemsPerPage: 20,
          totalItems: 0,
          currentPage: 1,
          totalPages: 1,
          sortBy: null,
        },
      },
      userDialog: false,
      autocompleateFilterd: null,
      user: {
        username: null,
        email: null,
        activated: true,
        roles: [],
        perms: [],
        superuser: false,
        password: null,
      },
      roles: [],
      autocompleate: [],
      loading: true,
      selected: null,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.selected = null
    this.roles = (await this.$axios.get('/admin/roles').then((res) => res.data)).filter((role) => role.id != 'banned')
    this.autocompleate = await this.$axios.get('/admin/roles/autocompleate').then((res) => res.data)
    this.users = await this.$axios
      .get('/users', {
        params: {
          page: this.users.meta.currentPage,
          limit: this.users.meta.itemsPerPage,
          search: this.filters.global.value,
          sortBy: this.users.meta.sortBy,
        },
      })
      .then((res) => res.data)
    this.loading = false
  },
  methods: {
    onPage(event) {
      this.users.meta.currentPage = event.page + 1
      this.users.meta.itemsPerPage = event.rows
      this.$fetch()
    },
    onSort(event) {
      this.users.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

      this.$fetch()
    },
    onFilter() {
      this.$fetch()
    },
    hideDialog() {
      this.userDialog = false
    },
    openDialog() {
      this.user = {
        username: null,
        email: null,
        activated: true,
        roles: ['default'],
        perms: [],
        superuser: false,
        password: null,
      }
      this.userDialog = true
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
    async removeMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/servers/mods/bulk/', {
              data: {
                items: this.selected.map((user) => user.uuid),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Пользователи успешно удалены',
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.$fetch()
        },
      })
    },
    async removeUser(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/users/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Пользователь успешно удален',
              life: 3000,
            })
          } catch {}
          await this.$fetch()
        },
      })
    },
    async removeMany() {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/users/bulk/', {
              data: {
                items: this.selected.map((user) => user.uuid),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: 'Пользователи успешно удалены',
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.$fetch()
        },
      })
    },
    async createUser() {
      this.loading = true
      try {
        await this.$axios.post('/users', this.user)
        this.$toast.add({
          severity: 'success',
          detail: 'Пользователь успешно добавлен',
          life: 3000,
        })
        this.userDialog = false
        await this.$fetch()
      } catch (err) {
        this.$toast.add({
          severity: 'error',
          detail: 'Введены некоректные данные, либо у вас недостаточно прав',
          life: 3000,
        })
      }
      this.loading = false
    },
  },
}
</script>
