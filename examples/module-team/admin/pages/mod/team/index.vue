<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Message severity="info" :closable="false" class="mb-3">{{ $t('mod.team.source_hint') }}</Message>

        <DataTable :value="members" :loading="loading" dataKey="uuid" rowHover responsiveLayout="scroll">
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('mod.team.page_title') }}</h5>
              <Button :label="$t('admin.refresh')" icon="pi pi-refresh" class="p-button-text" @click="load()" />
            </div>
          </template>
          <template #empty>
            <div class="py-4 text-center">
              <p class="m-0">{{ $t('mod.team.empty') }}</p>
              <small class="text-color-secondary">{{ $t('mod.team.empty_hint') }}</small>
            </div>
          </template>

          <Column :header="$t('mod.team.member_username')">
            <template #body="{ data }">
              <span class="font-medium">{{ data.username }}</span>
            </template>
          </Column>
          <Column :header="$t('mod.team.member_label')" :style="{ width: '16rem' }">
            <template #body="{ data }">
              <span :style="data.color && { color: data.color }">{{ data.label }}</span>
            </template>
          </Column>
          <Column :header="$t('mod.team.member_note')">
            <template #body="{ data }">
              <span v-if="data.note?.text">{{ data.note.text }}</span>
              <span v-else class="text-color-secondary">—</span>
            </template>
          </Column>
          <Column :style="{ width: '5rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success" :disabled="!canWrite" @click="openNote(data)" />
            </template>
          </Column>
        </DataTable>

        <SectionedDialog
          v-model:visible="noteDialog"
          v-model="section"
          :sections="sections"
          :header="$t('mod.team.member_note')"
          width="520px"
          class="p-fluid"
        >
          <template #before>
            <LocaleEditorBar
              v-model="translations.locale"
              :locales="translations.locales"
              :status="translations.status"
              :isDefault="translations.isDefault"
              @copy="translations.copyFromDefault()"
            />
          </template>
          <template #main>
            <div class="field">
              <label class="flex align-items-center gap-1">
                {{ $t('mod.team.member_note') }}
                <i v-tooltip.right="$t('mod.team.member_note_hint')" class="pi pi-question-circle text-color-secondary" />
              </label>
              <Textarea v-model="note.text" :autoResize="true" rows="3" />
            </div>
          </template>
          <template #translations>
            <ContentTranslationFields :translations="translations" />
          </template>
          <template #footer>
            <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="noteDialog = false" />
            <Button :label="$t('common.save')" icon="pi pi-check" class="p-button-text" :disabled="loading" @click="saveNote()" />
          </template>
        </SectionedDialog>
      </div>
    </div>
  </div>
</template>

<script>
import { useToast } from 'primevue/usetoast'

const NOTE_FIELDS = [{ path: 'text', label: 'mod.team.member_note', type: 'textarea' }]

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('mod.team.page_title')) })

    return {
      toast: useToast(),
      translations: useContentTranslations('mod.team.note', NOTE_FIELDS),
      ...useAccess({ canWrite: 'mod.team.write' }),
    }
  },
  data() {
    return {
      members: [],
      loading: true,
      noteDialog: false,
      section: 'main',
      note: { uuid: null, text: null },
    }
  },
  computed: {
    sections() {
      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle' },
        { key: 'translations', label: 'mod.team.translations', icon: 'pi pi-globe' },
      ]
    },
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.noteDialog = false
      this.members = await this.$api
        .get('/mod/team/members')
        .then((res) => res.data)
        .catch(() => [])
      this.loading = false
    },
    async openNote(member) {
      this.section = 'main'
      this.note = { uuid: member.uuid, text: member.note?.text || null }
      this.translations.attach(this.note)
      await this.translations.load(member.uuid)
      this.noteDialog = true
    },
    async saveNote() {
      this.loading = true

      const ok = await this.$api
        .patch(`/mod/team/members/${this.note.uuid}`, { text: this.note.text || undefined })
        .then(() => true)
        .catch(() => false)

      if (!ok) {
        this.loading = false

        return this.$utils.notifyError(null, this.$t('admin.invalid_data'))
      }

      await this.translations.save(this.note.uuid)
      this.toast.add({ severity: 'success', detail: this.$t('mod.team.note_saved'), life: 3000 })
      await this.load()
    },
  },
}
</script>
