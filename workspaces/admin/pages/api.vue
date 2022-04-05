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

        <DataTable :value="api" :loading="loading" :filters.sync="filters" rowHover responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление API-ключами</h5>
            </div>
          </template>
          <Column sortable field="secret" header="Ключ" :styles="{ width: '8rem' }"></Column>
          <Column sortable field="created" header="Создан" :styles="{ width: '8rem' }">
            <template #body="slotProps">
              {{ $moment(slotProps.data.created).local().format('MM/DD/YYYY HH:mm:ss') }}
            </template>
          </Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="removeToken(slotProps.data.secret)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
            </template>
          </Column>
        </DataTable>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :visible.sync="tokenDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            header="Создание/редактирование API-ключ"
            class="p-fluid"
          >
            <div class="field" v-if="updateMode">
              <label>API-ключ</label>
              <InputText v-model="token.secret" readonly />
            </div>
            <ValidationProvider name="Разрешения" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Разрешения</label>
                <span class="p-fluid">
                  <AutoComplete
                    v-model="token.perms"
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
            <ValidationProvider name="IP-адреса" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Доверенные IP-адреса</label>
                <Chips v-model="token.allow" />
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
                @click="updateMode ? updateToken() : createToken()"
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
    title: 'API-ключи',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      api: null,
      autocompleate: null,
      autocompleateFilterd: null,
      loading: true,
      updateMode: false,
      token: {
        secret: null,
        perms: [],
        allow: ['*'],
      },
      tokenDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  async fetch() {
    this.loading = true
    this.tokenDialog = false
    this.autocompleate = await this.$axios.get('/admin/roles/autocompleate').then((res) => res.data)
    this.api = await this.$axios.get('/admin/api').then((res) => res.data)
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
      this.tokenDialog = false
    },
    async openDialog(token = null) {
      this.updateMode = !!token
      if (token) {
        this.token = this.$_.pick(token, this.$_.deepKeys(this.token))
      } else {
        this.token = {
          secret: null,
          perms: [],
          allow: ['*'],
        }
      }
      this.tokenDialog = true
    },
    async createToken() {
      this.loading = true
      try {
        await this.$axios.post('/admin/api', this.token)
        this.$toast.add({
          severity: 'success',
          detail: 'API-ключ успешно добавлен',
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
    async updateToken() {
      this.loading = true
      try {
        await this.$axios.patch('/admin/api/' + this.token.secret, this.$_.omit(this.token, 'secret'))
        this.$toast.add({
          severity: 'success',
          detail: 'API-ключ успешно редактирован',
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
    async removeToken(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$axios.delete('/admin/api/' + id)
            this.$toast.add({
              severity: 'success',
              detail: 'API-ключ успешно удален',
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
