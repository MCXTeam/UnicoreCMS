<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <DataTable :value="forms" :loading="loading" dataKey="id" rowHover responsiveLayout="scroll">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
              <h5 class="m-0">{{ $t('mod.forms.title') }}</h5>
              <Button :label="$t('mod.forms.create')" icon="pi pi-plus" :disabled="!canWrite" @click="openCreate()" />
            </div>
          </template>
          <template #empty>
            <div class="py-4 text-center">
              <p class="m-0">{{ $t('mod.forms.list_empty') }}</p>
              <small class="text-color-secondary">{{ $t('mod.forms.list_empty_hint') }}</small>
            </div>
          </template>

          <Column :header="$t('admin.name')">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-file-edit text-color-secondary" />
                <div>
                  <div class="font-medium">{{ data.title }}</div>
                  <small class="text-color-secondary">/mod/forms/{{ data.slug }}</small>
                </div>
              </div>
            </template>
          </Column>

          <Column :header="$t('mod.forms.state')" :style="{ width: '12rem' }">
            <template #body="{ data }">
              <Tag :severity="data.enabled ? 'success' : 'secondary'" :value="$t(data.enabled ? 'mod.forms.on' : 'mod.forms.off')" />
              <Tag v-if="data.in_nav" severity="info" class="ml-2" :value="$t('mod.forms.in_nav_short')" />
            </template>
          </Column>

          <Column :header="$t('mod.forms.submissions')" :style="{ width: '11rem' }">
            <template #body="{ data }">
              <span>{{ data.total }}</span>
              <span v-if="data.fresh" class="ml-2 text-primary font-medium">+{{ data.fresh }}</span>
            </template>
          </Column>

          <Column :style="{ width: '8rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-1" @click="$router.push(`/mod/forms/${data.id}`)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" :disabled="!canWrite" @click="remove(data)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="createDialog" :header="$t('mod.forms.create')" :style="{ width: '640px' }" modal class="p-fluid">
      <div class="ff-presets">
        <button
          v-for="preset in presetCards"
          :key="preset.id"
          type="button"
          class="ff-preset"
          :class="draft.preset === preset.id && 'ff-preset--active'"
          @click="pick(preset)"
        >
          <i :class="preset.admin_icon" />
          <span class="ff-preset__name">{{ preset.id ? $t(preset.name) : $t('mod.forms.preset_blank') }}</span>
          <small>{{ preset.id ? $t(preset.summary) : $t('mod.forms.preset_blank_summary') }}</small>
        </button>
      </div>

      <div class="field mt-4">
        <label>{{ $t('admin.name') }}<span class="p-error"> *</span></label>
        <InputText v-model="draft.title" :placeholder="$t('mod.forms.title_placeholder')" />
      </div>

      <div class="field">
        <label class="flex align-items-center gap-1">
          {{ $t('mod.forms.slug') }}
          <i v-tooltip.right="$t('mod.forms.slug_hint')" class="pi pi-question-circle text-color-secondary" />
        </label>
        <InputGroup>
          <InputGroupAddon>/mod/forms/</InputGroupAddon>
          <InputText v-model="draft.slug" />
        </InputGroup>
      </div>

      <template #footer>
        <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="createDialog = false" />
        <Button :label="$t('mod.forms.create')" icon="pi pi-check" class="p-button-text" :disabled="!draft.title || saving" @click="create()" />
      </template>
    </Dialog>

  </div>
</template>

<script>
export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('mod.forms.title')) })

    return { ...useAccess({ canWrite: 'mod.forms.write' }) }
  },
  data() {
    return {
      forms: [],
      presets: [],
      loading: true,
      saving: false,
      createDialog: false,
      draft: { preset: null, title: '', slug: '' },
    }
  },
  computed: {
    presetCards() {
      return [{ id: null, admin_icon: 'pi pi-file', name: '', summary: '', slug: '', title: '' }, ...this.presets]
    },
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true

      const [forms, presets] = await Promise.all([
        this.$api.get('/mod/forms/manage').then((res) => res.data).catch(() => []),
        this.$api.get('/mod/forms/manage/presets').then((res) => res.data).catch(() => []),
      ])

      this.forms = forms
      this.presets = presets
      this.loading = false
    },
    openCreate() {
      this.draft = { preset: null, title: '', slug: '' }
      this.createDialog = true
    },
    pick(preset) {
      this.draft.preset = preset.id

      if (!preset.id) return

      this.draft.title = preset.title
      this.draft.slug = preset.slug
    },
    async create() {
      this.saving = true

      const form = await this.$api
        .post('/mod/forms/manage', {
          preset: this.draft.preset || undefined,
          title: this.draft.title,
          slug: this.draft.slug || undefined,
        })
        .then((res) => res.data)
        .catch(() => null)

      this.saving = false

      if (!form) return this.$utils.notifyError(null, this.$t('admin.invalid_data'))

      this.createDialog = false
      this.$router.push(`/mod/forms/${form.id}`)
    },
    remove(form) {
      this.$confirm.require({
        header: this.$t('admin.confirm_delete'),
        message: this.$t('mod.forms.remove_confirm', { name: form.title }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          const ok = await this.$api
            .delete(`/mod/forms/manage/${form.id}`)
            .then(() => true)
            .catch(() => false)

          if (!ok) return this.$utils.notifyError(null, this.$t('admin.invalid_data'))

          this.$toast.add({ severity: 'success', detail: this.$t('mod.forms.removed'), life: 3000 })
          await this.load()
        },
      })
    },
  },
}
</script>

<style scoped>
.ff-presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 0.75rem;
}
.ff-preset {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem;
  border: 1px solid var(--p-surface-300);
  border-radius: 0.75rem;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 150ms, background 150ms;
}
.ff-preset:hover {
  border-color: var(--p-primary-color);
}
.ff-preset--active {
  border-color: var(--p-primary-color);
  background: var(--p-highlight-background);
}
.ff-preset i {
  font-size: 1.25rem;
  color: var(--p-primary-color);
}
.ff-preset__name {
  font-weight: 600;
}
.ff-preset small {
  color: var(--p-text-muted-color);
  line-height: 1.35;
}
</style>
