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

        <VeeForm v-slot="{ meta }">
          <Dialog
            :style="{ width: '800px' }"
            v-model:visible="emailDialog"
            :closable="false"
            :modal="true"
            header="Редактирование Email-сообщения"
            class="p-fluid"
          >
            <VeeField v-model="email.title" name="title" label="Заголовок" rules="required" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Заголовок</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <div class="field">
              <label>Содержимое</label>
              <Editor v-model="email.content" editorStyle="height: 400px"></Editor>
            </div>
            <template #footer>
              <Button :disabled="loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button :disabled="loading || !meta.valid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="updateEmail" />
            </template>
          </Dialog>
        </VeeForm>

        <VeeForm v-slot="{ meta }">
          <Dialog :style="{ width: '400px' }" v-model:visible="testDialog" :modal="true" header="Тестировать SMTP сервер" class="p-fluid">
            <VeeField v-model="test.email" name="email" label="Email" rules="required|email" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Email</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <template #footer>
              <Button :disabled="loading || !meta.valid" label="Отправить" icon="pi pi-check" class="p-button-text" @click="sendTest" />
            </template>
          </Dialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { Form, Field } from 'vee-validate'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    useHead({ title: 'Email-сообшение' })
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
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.emailDialog = false
      this.emails = await this.$api.get('/admin/email').then((res) => res.data)
      this.loading = false
    },
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
        await this.$api.post('/admin/email/test', this.test)
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
        await this.$api.patch('/admin/email/' + this.email.id, this.$_.omit(this.email, 'id'))
        this.$toast.add({
          severity: 'success',
          detail: 'Email-сообшение успешно редактировано',
          life: 3000,
        })
        await this.load()
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
