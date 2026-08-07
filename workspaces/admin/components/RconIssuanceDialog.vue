<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :style="{ width: '980px' }"
    :modal="true"
    :header="$t('admin.rcon_templates_title')"
    class="p-fluid"
  >
    <div class="grid">
      <div class="col-12 md:col-7">
        <div class="field">
          <label>{{ $t('admin.rcon_preset') }}</label>
          <div class="flex gap-2">
            <Select
              v-model="preset"
              :options="presets"
              optionLabel="name"
              optionValue="id"
              appendTo="body"
              :placeholder="$t('admin.rcon_choose_preset')"
              class="flex-1"
            />
            <Button :label="$t('admin.rcon_fill')" icon="pi pi-bolt" class="p-button-secondary" @click="applyPreset" />
          </div>
          <small class="text-color-secondary">{{ presetNote }}</small>
        </div>

        <template v-for="section in sections" :key="section.title">
          <Divider align="left"
            ><span class="font-medium">{{ $t(section.title) }}</span></Divider
          >
          <div class="field" v-for="field in section.fields" :key="field.key">
            <label>{{ $t(field.label) }}</label>
            <InputText
              v-model="templates[field.key]"
              @focus="activeField = field.key"
              :placeholder="$t('admin.rcon_command_placeholder')"
            />
            <small class="preview" v-if="templates[field.key]">→ {{ renderPreview(templates[field.key]) }}</small>
          </div>
        </template>
      </div>

      <div class="col-12 md:col-5">
        <Panel :header="$t('admin.rcon_placeholders')">
          <p class="text-color-secondary mb-3 text-sm">{{ $t('admin.rcon_placeholders_hint') }}</p>
          <div v-for="(items, group) in placeholderGroups" :key="group" class="mb-3">
            <div class="font-medium mb-2">{{ $t(group) }}</div>
            <div class="flex flex-wrap gap-2">
              <Chip
                v-for="ph in items"
                :key="ph.token"
                :label="ph.token"
                class="placeholder-chip"
                v-tooltip.top="`${$t(ph.description)} (${ph.example})`"
                @click="insert(ph.token)"
              />
            </div>
          </div>
          <Message severity="info" :closable="false" class="mt-2">
            {{ $t('admin.rcon_duration_hint', { duration: period.duration, seconds: period.seconds }) }}
          </Message>
        </Panel>
      </div>
    </div>

    <template #footer>
      <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
      <Button :disabled="saving" :label="$t('common.save')" icon="pi pi-check" class="p-button-text" @click="save" />
    </template>
  </Dialog>
</template>

<script>
import { RCON_PLACEHOLDERS, RCON_PRESETS, renderTemplate, secondsToDuration } from 'unicore-common/issuance'
import { RCON_FIELD_MAP } from '~/constants'

export default {
  props: {
    visible: { type: Boolean, default: false },
  },
  emits: ['update:visible'],
  data() {
    return {
      presets: RCON_PRESETS,
      preset: 'luckperms',
      saving: false,
      activeField: 'group_add',
      templates: {
        give_item: '',
        group_add: '',
        group_add_temp: '',
        group_remove: '',
        perm_set: '',
        perm_set_temp: '',
        perm_unset: '',
      },
      sample: {
        user: { username: 'Notch', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5' },
        server: { id: 'hitech', name: 'HiTech', version: '1.12.2' },
        product: { id: 42, name: 'Diamond', item_id: 'minecraft:diamond', nbt: '', amount: 64, price: 99 },
        group: { ingame_id: 'vip' },
        permission: { node: 'essentials.fly' },
        period: { seconds: 2592000 },
      },
    }
  },
  computed: {
    sections() {
      return [
        { title: 'admin.rcon_section_items', fields: [{ key: 'give_item', label: 'admin.rcon_give_item' }] },
        {
          title: 'admin.rcon_section_groups',
          fields: [
            { key: 'group_add', label: 'admin.rcon_group_add' },
            { key: 'group_add_temp', label: 'admin.rcon_group_add_temp' },
            { key: 'group_remove', label: 'admin.rcon_group_remove' },
          ],
        },
        {
          title: 'admin.rcon_section_perms',
          fields: [
            { key: 'perm_set', label: 'admin.rcon_perm_set' },
            { key: 'perm_set_temp', label: 'admin.rcon_perm_set_temp' },
            { key: 'perm_unset', label: 'admin.rcon_perm_unset' },
          ],
        },
      ]
    },
    placeholderGroups() {
      return this.$_.groupBy(RCON_PLACEHOLDERS, 'group')
    },
    presetNote() {
      const found = RCON_PRESETS.find((p) => p.id === this.preset)
      return found ? this.$t(found.note) : ''
    },
    period() {
      return { seconds: this.sample.period.seconds, duration: secondsToDuration(this.sample.period.seconds) }
    },
  },
  watch: {
    visible(value) {
      if (value) this.load()
    },
  },
  methods: {
    async load() {
      const config = await this.$api.get('/config').then((res) => res.data)
      const map = this.$_.keyBy(config, 'key')
      this.preset = map['rcon_preset']?.value || 'luckperms'
      for (const [key, meta] of Object.entries(RCON_FIELD_MAP)) {
        this.templates[key] = map[meta.cfg]?.value || ''
      }
    },
    applyPreset() {
      const found = RCON_PRESETS.find((p) => p.id === this.preset)
      if (!found) return
      const vanilla = RCON_PRESETS.find((p) => p.id === 'vanilla')
      for (const [key, meta] of Object.entries(RCON_FIELD_MAP)) {
        let value = found.ops[meta.op]
        if (meta.op === 'giveItem' && !value) value = vanilla?.ops.giveItem
        this.templates[key] = value || ''
      }
    },
    insert(token) {
      if (!this.activeField) return
      const current = this.templates[this.activeField] || ''
      this.templates[this.activeField] = current + (current && !current.endsWith(' ') ? ' ' : '') + token
    },
    renderPreview(template) {
      return renderTemplate(template, this.sample)
    },
    async save() {
      this.saving = true
      try {
        await this.$api.patch('/config', { key: 'rcon_preset', value: this.preset, type: 1 })
        await Promise.all(
          Object.entries(RCON_FIELD_MAP).map(([key, meta]) =>
            this.$api.patch('/config', { key: meta.cfg, value: this.templates[key] || '', type: 1 }),
          ),
        )
        this.$toast.add({ severity: 'success', detail: this.$t('admin.rcon_templates_saved'), life: 3000 })
        this.$emit('update:visible', false)
      } catch {
        this.$toast.add({ severity: 'error', detail: this.$t('admin.rcon_templates_failed'), life: 3000 })
      }
      this.saving = false
    },
  },
}
</script>

<style scoped>
.placeholder-chip {
  cursor: pointer;
  font-size: 0.8rem;
}
.placeholder-chip:hover {
  filter: brightness(1.1);
}
.preview {
  display: block;
  margin-top: 0.25rem;
  color: var(--p-primary-color);
  font-family: monospace;
  word-break: break-all;
}
</style>
