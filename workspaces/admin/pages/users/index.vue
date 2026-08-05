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
          v-model:filters="filters"
          dataKey="uuid"
          :totalRecords="users.meta.totalItems"
          :loading="loading"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          v-model:selection="selected"
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
              {{ $moment(slotProps.data.created).format('MM/DD/YYYY HH:mm:ss') }}
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
              <NuxtLink :to="`/users/` + slotProps.data.uuid">
                <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              </NuxtLink>
              <Button @click="removeUser(slotProps.data.uuid)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <VeeForm as="div" v-slot="{ meta }">
      <Dialog
        v-model:visible="userDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        header="Создание пользователя"
        class="p-fluid"
      >
        <div class="p-fluid">
          <VeeField
            v-model="user.username"
            name="username"
            label="Имя пользователя"
            rules="required|isUsername"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <div class="field">
              <label>Имя пользователя</label>
              <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" type="text" />
              <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
            </div>
          </VeeField>
          <VeeField
            v-model="user.email"
            name="email"
            label="Email"
            rules="required|email"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <div class="field">
              <label>Email</label>
              <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" type="text" />
              <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
            </div>
          </VeeField>
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
          <VeeField
            v-model="user.password"
            name="password"
            label="Пароль"
            rules="required|min:6|max:32"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <div class="field">
              <label>Пароль</label>
              <InputText
                autocomplete="false"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
                placeholder="Без изменений"
                type="password"
              />
              <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
            </div>
          </VeeField>
          <VeeField
            v-model="passwordConfirm"
            name="password_confirm"
            label="Подтверждение пароля"
            rules="required|confirmed:@password"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <div class="field">
              <label>Подтверждение пароля</label>
              <InputText
                autocomplete="false"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
                placeholder="Без изменений"
                type="password"
              />
              <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
            </div>
          </VeeField>
        </div>
        <template #footer>
          <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
          <Button :disabled="loading || !meta.valid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="createUser()" />
        </template>
      </Dialog>
    </VeeForm>
  </div>
</template>

<script>
import { sortTransform } from '~/helpers'
import { FilterMatchMode } from '@primevue/core/api'
import { Form, Field } from 'vee-validate'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    useHead({ title: 'Пользователи' })
    const toast = useToast()
    const confirm = useConfirm()
    return { toast, confirm }
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
      passwordConfirm: null,
      roles: [],
      autocompleate: [],
      loading: true,
      selected: null,
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
      this.selected = null
      this.roles = (await this.$api.get('/admin/roles').then((res) => res.data)).filter((role) => role.id != 'banned')
      this.autocompleate = await this.$api.get('/admin/roles/autocompleate').then((res) => res.data)
      this.users = await this.$api
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
    onPage(event) {
      this.users.meta.currentPage = event.page + 1
      this.users.meta.itemsPerPage = event.rows
      this.load()
    },
    onSort(event) {
      this.users.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

      this.load()
    },
    onFilter() {
      this.load()
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
      this.passwordConfirm = null
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
    async removeUser(id) {
      this.confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/users/' + id)
            this.toast.add({
              severity: 'success',
              detail: 'Пользователь успешно удален',
              life: 3000,
            })
          } catch {}
          await this.load()
        },
      })
    },
    async removeMany() {
      this.confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/users/bulk/', {
              data: {
                items: this.selected.map((user) => user.uuid),
              },
            })
            this.toast.add({
              severity: 'success',
              detail: 'Пользователи успешно удалены',
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async createUser() {
      this.loading = true
      try {
        await this.$api.post('/users', this.user)
        this.toast.add({
          severity: 'success',
          detail: 'Пользователь успешно добавлен',
          life: 3000,
        })
        this.userDialog = false
        await this.load()
      } catch (err) {
        this.toast.add({
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
