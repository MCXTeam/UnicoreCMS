<template>
  <span>
    <Button :label="$t('admin.extension_install')" icon="pi pi-upload" class="p-button-text" @click="dialog = true" />

    <Dialog v-model:visible="dialog" modal :header="$t('admin.extension_install_title')" :style="{ width: '520px' }" @hide="reset">
      <p class="mt-0 mb-3 text-color-secondary">{{ $t('admin.extension_install_hint') }}</p>

      <div class="flex align-items-center gap-2 extension-archive">
        <FileUpload
          ref="archive"
          mode="basic"
          name="file"
          accept=".zip,application/zip,application/x-zip,application/x-zip-compressed,application/octet-stream"
          :customUpload="true"
          :auto="false"
          :chooseLabel="$t('admin.choose_file')"
          @select="select($event)"
          @clear="reset"
        />
      </div>

      <template #footer>
        <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" :disabled="loading" @click="dialog = false" />
        <Button
          :label="$t('admin.extension_install_button')"
          icon="pi pi-check"
          class="p-button-text"
          :loading="loading"
          :disabled="!fileName"
          @click="install"
        />
      </template>
    </Dialog>
  </span>
</template>

<script>
import { useToast } from 'primevue/usetoast'

const STEP_KEYS = ['dependencies', 'enable', 'rebuild', 'restart']

export default {
  emits: ['installed'],
  setup() {
    return { toast: useToast() }
  },
  data() {
    return {
      dialog: false,
      loading: false,
      fileName: '',
    }
  },
  methods: {
    reset() {
      this.$refs.archive?.clear?.()
      this.fileName = ''
    },

    select(event) {
      this.fileName = event.files?.[0]?.name || ''
    },

    steps(result) {
      const steps = STEP_KEYS.filter((key) => result.steps?.[key]).map((key) => this.$t(`admin.extension_step_${key}`))

      return steps.length ? this.$t('admin.extension_steps', { steps: steps.join(', ') }) : ''
    },

    async install() {
      const files = this.$refs.archive?.files || []

      if (!files.length) return

      const form = new FormData()

      form.append('file', files[0])
      this.loading = true

      try {
        const { data } = await this.$api.post('/admin/extensions', form, { headers: { 'Content-Type': 'multipart/form-data' } })

        this.toast.add({
          severity: 'success',
          summary: this.$t(`admin.extension_${data.previousVersion ? 'updated' : 'installed'}_${data.kind}`),
          detail: this.steps(data),
          life: 8000,
        })

        this.dialog = false
        this.$emit('installed', data)
      } catch (error) {
        this.toast.add({
          severity: 'error',
          summary: this.$t('admin.extension_install_error'),
          detail: error.response?.data?.message || this.$t('common.unknown_error'),
          life: 8000,
        })
      }

      this.loading = false
    },
  },
}
</script>

<style scoped>
.extension-archive :deep(input[type='file']) {
  display: none;
}
</style>
