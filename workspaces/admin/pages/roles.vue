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
        </Toolbar>
        <DataTable
          :value="roles"
          :loading="loading"
          :rows="50"
          paginator
          v-model:filters="filters"
          rowHover
          responsiveLayout="scroll"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.roles_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column field="id" header="ID" sortable></Column>
          <Column field="name" :header="$t('admin.name')" sortable>
            <template #body="slotProps">
              <span class="mr-2">{{ slotProps.data.name }}</span>
              <Tag v-if="slotProps.data.important" :value="$t('admin.role_edit_only')"></Tag>
            </template>
          </Column>
          <Column field="priority" :header="$t('admin.priority')"></Column>
          <Column :style="{ width: '8rem' }" :bodyStyle="{ 'text-align': 'right' }">
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

        <VeeForm as="div" v-slot="{ meta }">
          <Dialog
            v-model:visible="roleDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            :header="$t('admin.role_dialog')"
            class="p-fluid"
          >
            <VeeField
              v-model="role.id"
              name="id"
              label="ID (a-z)"
              :rules="{
                required: true,
                regex: /^[a-z]+$/,
              }"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>ID</label>
                <InputText :disabled="updateMode" :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" autofocus />
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="role.name"
              name="name"
              :label="$t('admin.name')"
              rules="required|alpha_dash"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>{{ $t('admin.name') }}</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="role.perms"
              name="perms"
              :label="$t('admin.permissions')"
              rules="required"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>{{ $t('admin.permissions') }}</label>
                <span class="p-fluid">
                  <AutoComplete
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    :multiple="true"
                    :suggestions="autocompleateFilterd"
                    @complete="searchAutocompleate($event)"
                    appendTo="body"
                    :completeOnFocus="true"
                    :placeholder="$t('admin.choose_permissions')"
                  />
                </span>
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="role.priority"
              name="priority"
              :label="$t('admin.priority')"
              rules="required"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>{{ $t('admin.priority') }}</label>
                <InputNumber :modelValue="value" @update:modelValue="handleChange" @input="handleChange($event.value)" @blur="handleBlur" />
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateRole() : createRole()"
              />
            </template>
          </Dialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
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

    useHead({ title: computed(() => $t('admin.menu_roles')) })
    const toast = useToast()
    const confirm = useConfirm()
    return { toast, confirm }
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
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.roles = await this.$api.get('/admin/roles').then((res) => res.data)

      this.autocompleate = await this.$api.get('/admin/roles/autocompleate').then((res) => res.data)

      this.roleDialog = false
      this.loading = false
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
        await this.$api.post('/admin/roles', this.role)
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.role_created'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.toast.add({
            severity: 'error',
            detail: this.$t('admin.role_exists'),
            life: 3000,
          })
        } else {
          this.toast.add({
            severity: 'error',
            detail: this.$t('admin.invalid_data'),
            life: 3000,
          })
        }
      }
    },
    async updateRole() {
      this.loading = true
      try {
        await this.$api.patch('/admin/roles/' + this.role.id, this.$_.omit(this.role, 'id'))
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.role_updated'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async removeRole(id) {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/admin/roles/' + id)
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.role_deleted'),
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
