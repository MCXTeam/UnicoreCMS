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
              <h5 class="m-0">Управление вебхуками</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" placeholder="Поиск..." />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :styles="{ width: '3rem' }"></Column>
          <Column sortable field="id" header="ID" :styles="{ width: '8rem' }"></Column>
          <Column field="name" header="Название" sortable></Column>
          <Column field="type" header="Событие" sortable></Column>
          <Column field="request" header="Формат" sortable></Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removeWebhook(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <VeeForm as="div" v-slot="{ meta }">
          <Dialog
            v-model:visible="webhookDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование вебхука"
            class="p-fluid"
          >
            <VeeField
              v-model="webhook.name"
              name="name"
              label="Название"
              rules="required"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>Название</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
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
            <VeeField v-model="webhook.type" name="type" label="Событие" rules="required" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Событие</label>
                <Select :modelValue="value" @update:modelValue="handleChange" :options="list" optionLabel="id" appendTo="body">
                  <template #option="slotProps">
                    <p class="mb-1">{{ slotProps.option.id }}</p>
                    <span class="text-gray-200">{{ slotProps.option.description }}</span>
                  </template>
                </Select>
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-if="webhook.type"
              v-model="webhook.request"
              name="request"
              label="Формат"
              rules="required"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <div class="field">
                <label>Формат</label>
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
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                label="Сохранить"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateWebhook() : createWebhook()"
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
    useHead({ title: 'Вебхуки' })
    const toast = useToast()
    const confirm = useConfirm()
    return { toast, confirm }
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
      },
      webhookDialog: false,
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
          detail: 'Гифт-код успешно добавлен',
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.toast.add({
          severity: 'error',
          detail: 'Введены некоректные данные',
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
          detail: 'Вебхук успешно редактирован',
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.toast.add({
          severity: 'error',
          detail: 'Введены некоректные данные',
          life: 3000,
        })
      }
    },
    async removeMany() {
      this.confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления ${this.selected.length} объектов`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/admin/webhooks/bulk/', {
              data: {
                items: this.selected.map((webhook) => webhook.id),
              },
            })
            this.toast.add({
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
    async removeWebhook(id) {
      this.confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/admin/webhooks/' + id)
            this.toast.add({
              severity: 'success',
              detail: 'Вебхук успешно удален',
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
