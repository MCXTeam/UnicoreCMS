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
          :filters.sync="filters"
          rowHover
          responsiveLayout="scroll"
          :selection.sync="selected"
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

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="webhookDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование вебхука"
            class="p-fluid"
          >
            <ValidationProvider name="Название" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Название</label>
                <InputText v-model="webhook.name" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="URL" rules="required|url" v-slot="{ errors }">
              <div class="field">
                <label>URL</label>
                <InputText v-model="webhook.url" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider name="Событие" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Событие</label>
                <Dropdown v-model="webhook.type" :options="list" optionLabel="id" appendTo="body">
                  <template #option="slotProps">
                    <p class="mb-1">{{ slotProps.option.id }}</p>
                    <span class="text-gray-200">{{ slotProps.option.description }}</span>
                  </template>
                </Dropdown>
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <ValidationProvider v-if="webhook.type" name="Событие" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Формат</label>
                <Dropdown v-model="webhook.request" :options="$_.get(list.find(whl => whl.id == $_.get(webhook.type, 'id')), 'supports')" appendTo="body" />
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
                @click="updateMode ? updateWebhook() : createWebhook()"
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
    title: 'Вебхуки',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
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
        url: null
      },
      webhookDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.webhookDialog = false
    this.list = await this.$axios.get('/admin/webhooks-list').then((res) => res.data)
    this.webhooks = await this.$axios.get('/admin/webhooks').then((res) => res.data)
    this.loading = false
  },
  methods: {
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
          url: null
        }
      }
      this.webhookDialog = true
    },
    async createWebhook() {
      this.loading = true
      try {
        await this.$axios.post('/admin/webhooks', {
          ...this.webhook, 
          type: this.webhook.type.id
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Гифт-код успешно добавлен',
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
    async updateWebhook() {
      this.loading = true
      try {
        await this.$axios.patch('/admin/webhooks/' + this.webhook.id, {
          ...this.$_.omit(this.webhook, 'id'), 
          type: this.webhook.type.id
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Вебхук успешно редактирован',
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
            await this.$axios.delete('/admin/webhooks/bulk/', {
              data: {
                items: this.selected.map((webhook) => webhook.id),
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
    async removeWebhook(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/admin/webhooks/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'Вебхук успешно удален',
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
