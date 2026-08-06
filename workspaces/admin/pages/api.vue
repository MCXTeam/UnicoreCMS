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

        <DataTable :value="api" :loading="loading" v-model:filters="filters" rowHover responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление API-ключами</h5>
            </div>
          </template>
          <Column sortable field="hint" header="Ключ" :style="{ width: '8rem' }">
            <template #body="slotProps">{{ slotProps.data.hint ? slotProps.data.hint + '…' : '—' }}</template>
          </Column>
          <Column sortable field="comment" header="Комментарий">
            <template #body="slotProps">{{ slotProps.data.comment || '—' }}</template>
          </Column>
          <Column sortable field="created" header="Создан" :style="{ width: '8rem' }">
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

        <Dialog v-model:visible="createdKeyDialog" :style="{ width: '600px' }" :modal="true" header="Новый API-ключ" class="p-fluid">
          <div class="field">
            <label>Скопируйте ключ — он больше не будет показан</label>
            <InputText :modelValue="createdKey" readonly />
          </div>
          <template #footer>
            <Button label="Готово" icon="pi pi-check" class="p-button-text" @click="createdKeyDialog = false" />
          </template>
        </Dialog>

        <VeeForm as="div" v-slot="{ meta }">
          <Dialog
            v-model:visible="tokenDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование API-ключ"
            class="p-fluid"
          >
            <div class="field" v-if="updateMode">
              <label>API-ключ</label>
              <InputText :modelValue="token.hint ? token.hint + '…' : ''" readonly />
              <small>Ключ показывается один раз при создании и в базе не хранится.</small>
            </div>
            <div class="field">
              <label>Комментарий</label>
              <InputText v-model="token.comment" placeholder="Для какого сервиса этот ключ" />
            </div>
            <VeeField v-model="token.perms" name="perms" label="Разрешения" rules="required" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Разрешения</label>
                <span class="p-fluid">
                  <AutoComplete
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    :multiple="true"
                    :suggestions="autocompleateFilterd"
                    @complete="searchAutocompleate($event)"
                    appendTo="body"
                    :completeOnFocus="true"
                    placeholder="Выберите разрешения"
                  />
                </span>
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField v-model="token.allow" name="allow" label="IP-адреса" rules="required" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Доверенные IP-адреса</label>
                <InputChips :modelValue="value" @update:modelValue="handleChange" />
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
    useHead({ title: 'API-ключи' })
    const toast = useToast()
    const confirm = useConfirm()
    return { toast, confirm }
  },
  data() {
    return {
      api: null,
      autocompleate: null,
      autocompleateFilterd: null,
      loading: true,
      updateMode: false,
      token: {
        hint: null,
        comment: null,
        perms: [],
        allow: ['*'],
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
          detail: 'API-ключ успешно добавлен',
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
    async updateToken() {
      this.loading = true
      try {
        await this.$api.patch('/admin/api/' + this.token.secret, this.$_.omit(this.token, ['secret', 'hint']))
        this.toast.add({
          severity: 'success',
          detail: 'API-ключ успешно редактирован',
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
    async removeToken(id) {
      this.confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/admin/api/' + id)
            this.toast.add({
              severity: 'success',
              detail: 'API-ключ успешно удален',
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
