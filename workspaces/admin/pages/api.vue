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

        <DataTable :value="api" :loading="loading" v-model:filters="filters" rowHover responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.api_title') }}</h5>
            </div>
          </template>
          <Column sortable field="hint" :header="$t('admin.api_key')" :style="{ width: '8rem' }">
            <template #body="slotProps">{{ slotProps.data.hint ? slotProps.data.hint + '…' : '—' }}</template>
          </Column>
          <Column sortable field="comment" :header="$t('admin.comment')">
            <template #body="slotProps">{{ slotProps.data.comment || '—' }}</template>
          </Column>
          <Column field="servers" :header="$t('admin.api_servers')">
            <template #body="slotProps">
              {{ slotProps.data.servers?.length ? slotProps.data.servers.join(', ') : $t('admin.api_servers_all') }}
            </template>
          </Column>
          <Column sortable field="created" :header="$t('admin.created')" :style="{ width: '8rem' }">
            <template #body="slotProps">
              {{ $moment(slotProps.data.created).format('MM/DD/YYYY HH:mm:ss') }}
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removeToken(slotProps.data.secret)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <Dialog
          v-model:visible="createdKeyDialog"
          :style="{ width: '600px' }"
          :modal="true"
          :header="$t('admin.api_new_key')"
          class="p-fluid"
        >
          <div class="field">
            <label>{{ $t('admin.api_copy_hint') }}</label>
            <InputText :modelValue="createdKey" readonly />
          </div>
          <template #footer>
            <Button :label="$t('admin.done')" icon="pi pi-check" class="p-button-text" @click="createdKeyDialog = false" />
          </template>
        </Dialog>

        <VeeForm as="div" v-slot="{ meta }">
          <Dialog
            v-model:visible="tokenDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            :header="$t('admin.api_dialog')"
            class="p-fluid"
          >
            <div class="field" v-if="updateMode">
              <label>{{ $t('admin.api_key_field') }}</label>
              <InputText :modelValue="token.hint ? token.hint + '…' : ''" readonly />
              <small>{{ $t('admin.api_key_hint') }}</small>
            </div>
            <div class="field">
              <label>{{ $t('admin.comment') }}</label>
              <InputText v-model="token.comment" :placeholder="$t('admin.api_comment_placeholder')" />
            </div>
            <VeeField
              v-model="token.perms"
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
            <div class="field">
              <label class="flex align-items-center gap-1">
                {{ $t('admin.api_servers') }}
                <i v-tooltip.right="$t('admin.api_servers_hint')" class="pi pi-question-circle text-color-secondary" />
              </label>
              <MultiSelect
                v-model="token.servers"
                :options="servers"
                optionLabel="name"
                optionValue="id"
                display="chip"
                :placeholder="$t('admin.api_servers_all')"
                :showToggleAll="false"
                appendTo="body"
              />
            </div>
            <VeeField
              v-model="token.allow"
              name="allow"
              :label="$t('admin.api_ips')"
              rules="required"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>{{ $t('admin.api_trusted_ips') }}</label>
                <InputChips :modelValue="value" @update:modelValue="handleChange" />
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
                @click="updateMode ? updateToken() : createToken()"
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

    useHead({ title: computed(() => $t('admin.menu_api')) })
    const toast = useToast()
    const confirm = useConfirm()
    return { toast, confirm }
  },
  data() {
    return {
      api: null,
      servers: [],
      autocompleate: null,
      autocompleateFilterd: null,
      loading: true,
      updateMode: false,
      token: {
        hint: null,
        comment: null,
        perms: [],
        allow: ['*'],
        servers: [],
      },
      tokenDialog: false,
      createdKey: null,
      createdKeyDialog: false,
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
      this.tokenDialog = false
      this.autocompleate = await this.$api.get('/admin/roles/autocompleate').then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)
      this.api = await this.$api.get('/admin/api').then((res) => res.data)
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
      this.tokenDialog = false
    },
    async openDialog(token = null) {
      this.updateMode = !!token
      if (token) {
        this.token = { ...this.$_.pick(token, this.$_.deepKeys(this.token)), secret: token.secret }
      } else {
        this.token = {
          hint: null,
          comment: null,
          perms: [],
          allow: ['*'],
          servers: [],
        }
      }
      this.tokenDialog = true
    },
    async createToken() {
      this.loading = true
      try {
        const { data } = await this.$api.post('/admin/api', this.$_.omit(this.token, ['hint', 'secret']))
        this.createdKey = data.key
        this.createdKeyDialog = true
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.api_created'),
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
    async updateToken() {
      this.loading = true
      try {
        await this.$api.patch('/admin/api/' + this.token.secret, this.$_.omit(this.token, ['secret', 'hint']))
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.api_updated'),
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
    async removeToken(id) {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/admin/api/' + id)
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.api_deleted'),
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
