<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <DataTable :value="emails" :loading="loading" rowHover responsiveLayout="scroll" dataKey="id">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.email_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <Button :label="$t('admin.email_test')" icon="pi pi-send" @click="openTestDialog" />
              </span>
            </div>
          </template>
          <Column sortable field="title" :header="$t('admin.heading')"></Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
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
            :header="$t('admin.email_dialog')"
            class="p-fluid"
          >
            <LocaleEditorBar
              v-model="translations.locale"
              :locales="translations.locales"
              :status="translations.status"
              :isDefault="translations.isDefault"
              @copy="translations.copyFromDefault()"
            />
            <template v-if="translations.isDefault">
              <VeeField
                v-model="email.title"
                name="title"
                :label="$t('admin.heading')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.heading') }}</label>
                  <InputText :modelValue="value" @update:modelValue="handleChange" />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field">
                <label>{{ $t('admin.content') }}</label>
                <Editor v-model="email.content" editorStyle="height: 400px"></Editor>
              </div>
            </template>
            <ContentTranslationFields v-else :translations="translations" />
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateEmail"
              />
            </template>
          </Dialog>
        </VeeForm>

        <VeeForm v-slot="{ meta }">
          <Dialog
            :style="{ width: '400px' }"
            v-model:visible="testDialog"
            :modal="true"
            :header="$t('admin.email_test_dialog')"
            class="p-fluid"
          >
            <VeeField v-model="test.email" name="email" label="Email" rules="required|email" v-slot="{ value, errorMessage, handleChange }">
              <div class="field">
                <label>Email</label>
                <InputText :modelValue="value" @update:modelValue="handleChange" />
                <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <template #footer>
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('admin.send')"
                icon="pi pi-check"
                class="p-button-text"
                @click="sendTest"
              />
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
    const translations = useContentTranslations('email_message')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_email')) })

    return { translations }
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
    async openDialog(email) {
      this.email = this.$_.pick(email, this.$_.deepKeys(this.email))
      this.translations.attach(this.email)
      await this.translations.load(email ? email.id : null)
      this.emailDialog = true
    },
    async sendTest() {
      this.loading = true
      try {
        await this.$api.post('/admin/email/test', this.test)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.email_sent'),
          life: 3000,
        })
        this.testDialog = false
        this.loading = false
      } catch {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.email_send_failed'),
          life: 3000,
        })
      }
    },
    async updateEmail() {
      this.loading = true
      try {
        await this.$api.patch('/admin/email/' + this.email.id, this.$_.omit(this.email, 'id'))

        await this.translations.save(this.email.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.email_updated'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
  },
}
</script>
