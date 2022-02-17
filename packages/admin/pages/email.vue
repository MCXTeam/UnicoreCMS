<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <DataTable :value="emails" :loading="loading" rowHover responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">Управление Email-сообщениями</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <Button label="Тестировать" icon="pi pi-send" @click="openTestDialog" />
              </span>
            </div>
          </template>
          <Column sortable field="title" header="Заголовок"></Column>
          <Column :styles="{ width: '12rem' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
            </template>
          </Column>
        </DataTable>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog
            :style="{ width: '800px' }"
            :visible.sync="emailDialog"
            :closable="false"
            :modal="true"
            header="Редактирование Email-сообщения"
            class="p-fluid"
          >
            <ValidationProvider name="Заголовок" rules="required" v-slot="{ errors }">
              <div class="field">
                <label>Заголовок</label>
                <InputText v-model="email.title" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <div class="field">
              <label>Содержимое</label>
              <Editor v-model="email.content" editorStyle="height: 400px"></Editor>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button :disabled="loading || invalid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="updateEmail" />
            </template>
          </Dialog>
        </ValidationObserver>

        <ValidationObserver v-slot="{ invalid }">
          <Dialog :style="{ width: '400px' }" :visible.sync="testDialog" :modal="true" header="Тестировать SMTP сервер" class="p-fluid">
            <ValidationProvider name="Email" rules="required|email" v-slot="{ errors }">
              <div class="field">
                <label>Email</label>
                <InputText v-model="test.email" />
                <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
              </div>
            </ValidationProvider>
            <template #footer>
              <Button :disabled="loading || invalid" label="Отправить" icon="pi pi-check" class="p-button-text" @click="sendTest" />
            </template>
          </Dialog>
        </ValidationObserver>
      </div>
    </div>
  </div>
</template>

<script>
import { ValidationObserver, ValidationProvider } from 'vee-validate'

export default {
  head: {
    title: 'Email-сообшение',
  },
  components: {
    ValidationObserver,
    ValidationProvider,
  },
  data() {
    return {
      emails: null,
      loading: true,
      mods: null,
      email: {
        id: null,
        title: null,
        content: null,
      },
      test: {
        email: null,
      },
      emailDialog: false,
      testDialog: false,
    }
  },
  async fetch() {
    this.loading = true
    this.emailDialog = false
    this.emails = await this.$axios.get('/admin/email').then((res) => res.data)
    this.loading = false
  },
  methods: {
    hideDialog() {
      this.emailDialog = false
    },
    openTestDialog(email) {
      this.testDialog = true
    },
    openDialog(email) {
      this.email = this.$_.pick(email, this.$_.deepKeys(this.email))
      this.emailDialog = true
    },
    async sendTest() {
      this.loading = true
      try {
        await this.$axios.post('/admin/email/test', this.test)
        this.$toast.add({
          severity: 'success',
          detail: 'Email-сообшение успешно отправлено',
          life: 3000,
        })
        this.testDialog = false
        this.loading = false
      } catch {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: 'При отправке произошла ошибка, подробности в консоли',
          life: 3000,
        })
      }
    },
    async updateEmail() {
      this.loading = true
      try {
        await this.$axios.patch('/admin/email/' + this.email.id, this.$_.omit(this.email, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Email-сообшение успешно редактировано',
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
  },
}
</script>
