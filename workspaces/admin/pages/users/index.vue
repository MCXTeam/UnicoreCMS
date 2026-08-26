<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button v-if="canCreate" :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
                v-if="canDeleteMany"
                :label="$t('admin.delete')"
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
              <h5 class="m-0">{{ $t('admin.users_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="username" :header="$t('admin.username')" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center">
                <SkinView2D class="rounded" :width="16" :height="16" :skin="slotProps.data.skin" />
                <span class="ml-2">{{ slotProps.data.username }}</span>
              </div>
            </template>
          </Column>
          <Column field="email" header="Email" sortable></Column>
          <Column field="created" :header="$t('admin.registered_date')" sortable>
            <template #body="slotProps">
              {{ $moment(slotProps.data.created).format('MM/DD/YYYY HH:mm:ss') }}
            </template>
          </Column>
          <Column field="roles" :header="$t('admin.roles')">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-if="slotProps.data.superuser" value="SuperUser"></Tag>
              <Tag class="mr-2 mb-2" v-for="role in slotProps.data.roles" :key="role.id" :value="role.name"></Tag>
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <NuxtLink :to="`/users/` + slotProps.data.uuid">
                <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              </NuxtLink>
              <Button
                v-if="canDelete"
                @click="removeUser(slotProps.data.uuid)"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <VeeForm as="div" v-slot="{ meta }">
      <SectionedDialog
        v-model:visible="userDialog"
        v-model="section"
        :sections="sections"
        :header="$t('admin.user_create_dialog')"
        width="480px"
        class="p-fluid"
      >
        <template #main>
          <VeeField
            v-model="user.username"
            name="username"
            :label="$t('admin.username')"
            rules="required|isUsername"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <div class="field">
              <label>{{ $t('admin.username') }}<span class="p-error"> *</span></label>
              <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" type="text" />
              <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
            </div>
          </VeeField>
          <VeeField
            v-model="user.email"
            name="email"
            label="Email"
            :rules="canEditEmail ? 'required|email' : ''"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <div class="field">
              <label>Email<span v-if="canEditEmail" class="p-error"> *</span><FieldLock :allowed="canEditEmail" /></label>
              <InputText
                :modelValue="value"
                :disabled="!canEditEmail"
                @update:modelValue="handleChange"
                @blur="handleBlur"
                type="text"
              />
              <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
            </div>
          </VeeField>
          <div class="field-checkbox">
            <Checkbox :binary="true" v-model="user.activated" :disabled="!canEditActivated" />
            <label>{{ $t('admin.activated_email') }}<FieldLock :allowed="canEditActivated" /></label>
          </div>
          <VeeField
            v-model="user.password"
            name="password"
            :label="$t('auth.password')"
            rules="required|min:8|max:128"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <div class="field">
              <label>{{ $t('auth.password') }}<span class="p-error"> *</span></label>
              <div class="flex gap-2">
                <InputText
                  autocomplete="false"
                  class="flex-1"
                  :modelValue="value"
                  @update:modelValue="handleChange"
                  @blur="handleBlur"
                  :placeholder="$t('admin.unchanged')"
                  :type="passwordVisible ? 'text' : 'password'"
                />
                <Button
                  type="button"
                  icon="pi pi-refresh"
                  class="p-button-secondary"
                  v-tooltip.bottom="$t('admin.password_generate')"
                  @click="fillGeneratedPassword(handleChange)"
                />
              </div>
              <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
            </div>
          </VeeField>
          <VeeField
            v-model="passwordConfirm"
            name="password_confirm"
            :label="$t('auth.password_confirm')"
            rules="required|confirmed:@password"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <div class="field">
              <label>{{ $t('auth.password_confirm') }}<span class="p-error"> *</span></label>
              <InputText
                autocomplete="false"
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
                :placeholder="$t('admin.unchanged')"
                type="password"
              />
              <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
            </div>
          </VeeField>
        </template>

        <template #access>
          <div class="field">
            <label>{{ $t('admin.roles') }}<FieldLock :allowed="canEditRoles" /></label>
            <MultiSelect
              display="chip"
              :filter="true"
              :disabled="!canEditRoles"
              v-model="user.roles"
              optionDisabled="important"
              :options="roles"
              optionLabel="name"
              optionValue="id"
              :placeholder="$t('admin.choose_roles')"
              class="p-column-filter"
            />
          </div>
          <PermissionsPicker v-model="user.perms" :label="$t('admin.rights')" :disabled="!canEditRoles" />
          <div class="field-checkbox" v-if="canEditSuperuser">
            <Checkbox :binary="true" v-model="user.superuser" />
            <label>{{ $t('admin.superuser') }}</label>
          </div>
        </template>

        <template #footer>
          <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
          <Button
            :disabled="loading || !meta.valid"
            :label="$t('common.save')"
            icon="pi pi-check"
            class="p-button-text"
            @click="createUser()"
          />
        </template>
      </SectionedDialog>
    </VeeForm>
  </div>
</template>

<script>
import { generatePassword } from 'unicore-common/password'
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
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_users')) })
    const toast = useToast()
    const confirm = useConfirm()
    const access = useAccess({
      canCreate: 'panel.users.create',
      canDelete: 'panel.users.delete',
      canDeleteMany: 'panel.users.delete.many',
    })

    const fields = useFieldAccess('user', {
      canEditUsername: 'username',
      canEditEmail: 'email',
      canEditActivated: 'activated',
      canEditRoles: 'roles',
      canEditSuperuser: 'superuser',
    })

    return { toast, confirm, ...access, ...fields }
  },
  computed: {
    sections() {
      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle' },
        { key: 'access', label: 'admin.roles_and_rights', icon: 'pi pi-key' },
      ]
    },
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
      section: 'main',
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
      passwordVisible: false,
      roles: [],
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
    fillGeneratedPassword(handleChange) {
      const password = generatePassword()

      this.user.password = password
      this.passwordConfirm = password
      this.passwordVisible = true

      handleChange(password)
    },

    async load() {
      this.loading = true
      this.selected = null
      this.roles = (await this.$api.get('/admin/roles').then((res) => res.data)).filter((role) => role.id != 'banned')
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
    async removeUser(id) {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/users/' + id)
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.user_deleted'),
              life: 3000,
            })
          } catch {}
          await this.load()
        },
      })
    },
    async removeMany() {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.delete_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/users/bulk', {
              data: {
                items: this.selected.map((user) => user.uuid),
              },
            })
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.users_deleted'),
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
          detail: this.$t('admin.user_created'),
          life: 3000,
        })
        this.userDialog = false
        await this.load()
      } catch (err) {
        this.$utils.notifyError(err, this.$t('admin.invalid_data'))
      }
      this.loading = false
    },
  },
}
</script>
