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
        </Toolbar>

        <DataTable
          :value="referals.data"
          lazy
          paginator
          :rows="referals.meta.itemsPerPage"
          v-model:filters="filters"
          dataKey="userUuid"
          :totalRecords="referals.meta.totalItems"
          :loading="loading"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          rowHover
          responsiveLayout="scroll"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.referals_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>

          <Column field="user.username" :header="$t('admin.referal_player')" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center">
                <SkinView2D class="rounded" :width="16" :height="16" :skin="slotProps.data.user?.skin" />
                <span class="ml-2">{{ slotProps.data.user?.username }}</span>
              </div>
            </template>
          </Column>
          <Column field="inviter.username" :header="$t('admin.referal_inviter')" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center">
                <SkinView2D class="rounded" :width="16" :height="16" :skin="slotProps.data.inviter?.skin" />
                <span class="ml-2">{{ slotProps.data.inviter?.username }}</span>
              </div>
            </template>
          </Column>
          <Column field="rewarded" :header="$t('admin.referal_rewarded')" sortable>
            <template #body="slotProps">
              <Tag v-if="slotProps.data.rewarded" severity="success" :value="$t('admin.yes')" />
              <Tag v-else severity="secondary" :value="$t('admin.no')" />
            </template>
          </Column>
          <Column :style="{ width: '8rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="canUpdate"
                @click="openDialog(slotProps.data)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success mr-2"
              />
              <Button v-if="canDelete" @click="remove(slotProps.data)" icon="pi pi-trash" class="p-button-rounded p-button-danger" />
            </template>
          </Column>

          <template #empty>{{ $t('admin.referals_empty') }}</template>
        </DataTable>

        <Dialog v-model:visible="dialog" :style="{ width: '520px' }" :header="$t('admin.referal_dialog')" :modal="true" class="p-fluid">
          <div class="field">
            <label>{{ $t('admin.referal_player') }}<span class="p-error"> *</span></label>
            <AutoComplete
              v-model="form.user"
              :suggestions="candidates"
              @complete="search($event)"
              optionLabel="username"
              appendTo="body"
              :disabled="updateMode"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <SkinView2D class="rounded" :width="16" :height="16" :skin="slotProps.option.skin" />
                  <span class="ml-2">{{ slotProps.option.username }}</span>
                </div>
              </template>
            </AutoComplete>
          </div>

          <div class="field">
            <label>{{ $t('admin.referal_inviter') }}<span class="p-error"> *</span></label>
            <AutoComplete v-model="form.inviter" :suggestions="candidates" @complete="search($event)" optionLabel="username" appendTo="body">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <SkinView2D class="rounded" :width="16" :height="16" :skin="slotProps.option.skin" />
                  <span class="ml-2">{{ slotProps.option.username }}</span>
                </div>
              </template>
            </AutoComplete>
            <small class="text-color-secondary">{{ $t('admin.referal_inviter_hint') }}</small>
          </div>

          <template #footer>
            <Button :label="$t('common.cancel')" icon="pi pi-times" text @click="dialog = false" />
            <Button :label="$t('common.save')" icon="pi pi-check" :disabled="!ready" :loading="loading" @click="save()" />
          </template>
        </Dialog>
      </div>
    </div>
  </div>
</template>

<script>
import { FilterMatchMode } from '@primevue/core/api'
import { sortTransform } from '~/helpers'

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_referals')) })

    const toast = useToast()
    const confirm = useConfirm()
    const access = useAccess({
      canCreate: 'panel.referals.create',
      canUpdate: 'panel.referals.update',
      canDelete: 'panel.referals.delete',
    })

    return { toast, confirm, ...access }
  },

  data() {
    return {
      referals: { data: [], meta: { currentPage: 1, itemsPerPage: 20, totalItems: 0, sortBy: [] } },
      candidates: [],
      loading: false,
      dialog: false,
      updateMode: false,
      form: { user: null, inviter: null },
      filters: { global: { value: null, matchMode: FilterMatchMode.CONTAINS } },
    }
  },

  computed: {
    ready() {
      return Boolean(this.form.user?.uuid && this.form.inviter?.uuid)
    },
  },

  mounted() {
    this.load()
  },

  methods: {
    async load() {
      this.loading = true

      this.referals = await this.$api
        .get('/admin/referals', {
          params: {
            page: this.referals.meta.currentPage,
            limit: this.referals.meta.itemsPerPage,
            search: this.filters.global.value,
            sortBy: this.referals.meta.sortBy,
          },
        })
        .then((res) => res.data)

      this.loading = false
    },

    async search(event) {
      this.candidates = await this.$api
        .get('/admin/referals/lookup', { params: { search: event.query } })
        .then((res) => res.data)
        .catch(() => [])
    },

    onPage(event) {
      this.referals.meta.currentPage = event.page + 1
      this.referals.meta.itemsPerPage = event.rows
      this.load()
    },

    onSort(event) {
      this.referals.meta.sortBy = sortTransform(event.sortOrder, event.sortField)
      this.load()
    },

    onFilter() {
      this.referals.meta.currentPage = 1
      this.load()
    },

    openDialog(row) {
      this.updateMode = Boolean(row)
      this.form = { user: row?.user || null, inviter: row?.inviter || null }
      this.candidates = []
      this.dialog = true
    },

    async save() {
      if (!this.ready) return

      this.loading = true

      try {
        if (this.updateMode)
          await this.$api.patch(`/admin/referals/${this.form.user.uuid}`, { inviter_uuid: this.form.inviter.uuid })
        else await this.$api.post('/admin/referals', { user_uuid: this.form.user.uuid, inviter_uuid: this.form.inviter.uuid })

        this.toast.add({
          severity: 'success',
          detail: this.$t(this.updateMode ? 'admin.referal_updated' : 'admin.referal_created'),
          life: 3000,
        })

        this.dialog = false
      } catch (err) {
        this.toast.add({
          severity: 'error',
          detail: this.$t(err.response?.status === 409 ? 'admin.referal_exists' : 'admin.invalid_data'),
          life: 3000,
        })
      }

      this.loading = false

      await this.load()
    },

    remove(row) {
      this.confirm.require({
        message: this.$t('admin.referal_remove_confirm', { name: row.user?.username }),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true

          try {
            await this.$api.delete(`/admin/referals/${row.userUuid}`)
            this.toast.add({ severity: 'success', detail: this.$t('admin.referal_deleted'), life: 3000 })
          } catch {}

          this.loading = false

          await this.load()
        },
      })
    },
  },
}
</script>
