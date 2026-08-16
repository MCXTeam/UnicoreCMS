<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
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
          :value="webhooks"
          :loading="loading"
          :rows="20"
          paginator
          v-model:filters="filters"
          rowHover
          responsiveLayout="scroll"
          v-model:selection="selected"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.webhooks_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column sortable field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column field="name" :header="$t('admin.name')" sortable></Column>
          <Column field="type" :header="$t('admin.event')" sortable></Column>
          <Column field="request" :header="$t('admin.format')" sortable></Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removeWebhook(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <VeeForm as="div" v-slot="{ meta }">
          <SectionedDialog
            v-model:visible="webhookDialog"
            v-model="section"
            :sections="sections"
            :header="$t('admin.webhook_dialog')"
            width="620px"
            class="p-fluid"
          >
            <template #main>
              <VeeField
                v-model="webhook.name"
                name="name"
                :label="$t('admin.name')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.name') }}</label>
                  <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
                  <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-model="webhook.type"
                name="type"
                :label="$t('admin.event')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.event') }}</label>
                  <Select :modelValue="value" @update:modelValue="handleChange" :options="list" optionLabel="id" appendTo="body">
                    <template #option="slotProps">
                      <p class="mb-1">{{ slotProps.option.id }}</p>
                      <span class="text-gray-200">{{ $t(slotProps.option.description) }}</span>
                    </template>
                  </Select>
                  <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-if="webhook.type"
                v-model="webhook.request"
                name="request"
                :label="$t('admin.format')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.format') }}</label>
                  <Select
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    :options="
                      $_.get(
                        list.find((whl) => whl.id == $_.get(webhook.type, 'id')),
                        'supports',
                      )
                    "
                    appendTo="body"
                  />
                  <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-if="needsUrl"
                v-model="webhook.url"
                name="url"
                label="URL"
                rules="required|url"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>URL</label>
                  <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
                  <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-if="needsTarget"
                v-model="webhook.target"
                name="target"
                :label="$t('admin.webhook_target')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.webhook_target') }}</label>
                  <InputText
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @blur="handleBlur"
                    :placeholder="webhook.request === 'telegram' ? '@channel' : '123456789'"
                  />
                  <small>{{ webhook.request === 'telegram' ? $t('admin.webhook_target_telegram') : $t('admin.webhook_target_vk') }}</small>
                  <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
            </template>

            <template #publish>
              <div class="field">
                <div class="flex align-items-center gap-2">
                  <Checkbox v-model="webhook.auto_publish" inputId="webhook-auto-publish" :binary="true" />
                  <label for="webhook-auto-publish" class="m-0">{{ $t('admin.webhook_auto_publish') }}</label>
                </div>
                <small>{{ $t('admin.webhook_auto_publish_hint') }}</small>
              </div>
              <div class="field">
                <div class="flex align-items-center gap-2">
                  <Checkbox v-model="webhook.update_on_edit" inputId="webhook-update-on-edit" :binary="true" />
                  <label for="webhook-update-on-edit" class="m-0">{{ $t('admin.webhook_update_on_edit') }}</label>
                </div>
                <small>{{ $t('admin.webhook_update_on_edit_hint') }}</small>
              </div>
            </template>

            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateWebhook() : createWebhook()"
              />
            </template>
          </SectionedDialog>
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

    useHead({ title: computed(() => $t('admin.menu_webhooks')) })
    const toast = useToast()
    const confirm = useConfirm()
    return { toast, confirm }
  },
  computed: {
    sections() {
      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle' },
        { key: 'publish', label: 'admin.section_publish', icon: 'pi pi-send', hidden: !this.isNewsWebhook },
      ]
    },
    isNewsWebhook() {
      return this.$_.get(this.webhook.type, 'id') === 'news_created'
    },
    needsUrl() {
      return ['discord', 'json'].includes(this.webhook.request)
    },
    needsTarget() {
      return ['telegram', 'vk'].includes(this.webhook.request)
    },
  },
  data() {
    return {
      webhooks: null,
      loading: true,
      selected: null,
      updateMode: false,
      list: null,
      webhook: {
        id: null,
        name: null,
        type: null,
        request: null,
        url: null,
        target: null,
        auto_publish: true,
        update_on_edit: true,
      },
      webhookDialog: false,
      section: 'main',
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
      this.webhookDialog = false
      this.list = await this.$api.get('/admin/webhooks-list').then((res) => res.data)
      this.webhooks = await this.$api.get('/admin/webhooks').then((res) => res.data)
      this.loading = false
    },
    hideDialog() {
      this.webhookDialog = false
    },
    async openDialog(webhook = null) {
      this.updateMode = !!webhook
      if (webhook) {
        this.webhook = this.$_.pick(webhook, this.$_.deepKeys(this.webhook))
        this.webhook.type = this.list.find((whl) => whl.id == this.webhook.type)
      } else {
        this.webhook = {
          id: null,
          name: null,
          type: null,
          request: null,
          url: null,
          target: null,
          auto_publish: true,
          update_on_edit: true,
        }
      }
      this.webhookDialog = true
    },
    async createWebhook() {
      this.loading = true
      try {
        await this.$api.post('/admin/webhooks', {
          ...this.webhook,
          type: this.webhook.type.id,
        })
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.webhook_created'),
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
    async updateWebhook() {
      this.loading = true
      try {
        await this.$api.patch('/admin/webhooks/' + this.webhook.id, {
          ...this.$_.omit(this.webhook, 'id'),
          type: this.webhook.type.id,
        })
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.webhook_updated'),
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
    async removeMany() {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.delete_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/admin/webhooks/bulk', {
              data: {
                items: this.selected.map((webhook) => webhook.id),
              },
            })
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.webhooks_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async removeWebhook(id) {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/admin/webhooks/' + id)
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.webhook_deleted'),
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
