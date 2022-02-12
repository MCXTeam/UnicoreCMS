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
          :value="roles"
          :loading="loading"
          :rows="50"
          paginator
          :filters.sync="filters"
          rowHover
          responsiveLayout="scroll"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление ролями</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column field="id" header="ID" sortable></Column>
          <Column field="name" header="Название" sortable>
            <template #body="slotProps">
              <span class="mr-2">{{ slotProps.data.name }}</span>
              <Tag v-if="slotProps.data.important" value="Только редактирование"></Tag>
            </template>
          </Column>
          <Column field="priority" header="Приоритет"></Column>
          <Column :styles="{ width: '8rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button
                @click="removeRole(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="roleDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            header="Создание/редактирование роли"
            class="p-fluid"
          >
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
                <InputText :disabled="updateMode" v-model="role.id" autofocus />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Название" rules="required|alpha_dash" v-slot="{ errors }">
              <div class="field">
                <label>Название</label>
                <InputText v-model="role.name" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Разрешения" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Разрешения</label>
                <span class="p-fluid">
                  <AutoComplete
                    v-model="role.perms"
                    :multiple="true"
                    :suggestions="autocompleateFilterd"
                    @complete="searchAutocompleate($event)"
                    appendTo="body"
                    :completeOnFocus="true"
                    placeholder="Выберите разрешения"
                  />
                </span>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Приоритет" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Приоритет</label>
                <InputNumber v-model="role.priority" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || invalid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateRole() : createRole()"
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
    title: 'Роли',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      roles: null,
      loading: true,
      autocompleate: null,
      autocompleateFilterd: null,
      updateMode: false,
      role: {
        id: null,
        name: null,
        priority: 0,
        perms: [],
      },
      roleDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.roles = await this.$axios.get('/admin/roles').then((res) => res.data)

    this.autocompleate = await this.$axios.get('/admin/roles/autocompleate').then((res) => res.data)

    this.roleDialog = false
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
      this.roleDialog = false
    },
    openDialog(role = null) {
      this.updateMode = !!role
      if (role) {
        this.role = this.$_.pick(role, this.$_.deepKeys(this.role))
      } else {
        this.role = {
          id: null,
          name: null,
          priority: 0,
          perms: [],
        }
      }
      this.roleDialog = true
    },
    async createRole() {
      this.loading = true
      try {
        await this.$axios.post('/admin/roles', this.role)
        this.$toast.add({
          severity: 'success',
          detail: 'Роль успешно добавлена',
          life: 3000,
        })
        await this.$fetch()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.$toast.add({
            severity: 'error',
            detail: 'Роль с данным ID уже присутствует',
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
    async updateRole() {
      this.loading = true
      try {
        await this.$axios.patch('/admin/roles/' + this.role.id, this.$_.omit(this.role, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Роль успешно редактирована',
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
    async removeRole(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/admin/roles/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Роль успешно удалена',
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
