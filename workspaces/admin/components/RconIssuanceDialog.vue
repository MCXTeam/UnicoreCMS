<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :style="{ width: '980px' }"
    :modal="true"
    header="Выдача через RCON — шаблоны команд"
    class="p-fluid"
  >
    <div class="grid">
      <div class="col-12 md:col-7">
        <div class="field">
          <label>Пресет плагина</label>
          <div class="flex gap-2">
            <Select
              v-model="preset"
              :options="presets"
              optionLabel="name"
              optionValue="id"
              appendTo="body"
              placeholder="Выберите пресет"
              class="flex-1"
            />
            <Button label="Заполнить" icon="pi pi-bolt" class="p-button-secondary" @click="applyPreset" />
          </div>
          <small class="text-color-secondary">{{ presetNote }}</small>
        </div>

        <template v-for="section in sections" :key="section.title">
          <Divider align="left"
            ><span class="font-medium">{{ section.title }}</span></Divider
          >
          <div class="field" v-for="field in section.fields" :key="field.key">
            <label>{{ field.label }}</label>
            <InputText v-model="templates[field.key]" @focus="activeField = field.key" placeholder="Команда без слэша" />
            <small class="preview" v-if="templates[field.key]">→ {{ renderPreview(templates[field.key]) }}</small>
          </div>
        </template>
      </div>

      <div class="col-12 md:col-5">
        <Panel header="Плейсхолдеры (клик — вставить)">
          <p class="text-color-secondary mb-3 text-sm">
            Кликните по полю команды слева, затем по плейсхолдеру — он подставится в это поле.
          </p>
          <div v-for="(items, group) in placeholderGroups" :key="group" class="mb-3">
            <div class="font-medium mb-2">{{ group }}</div>
            <div class="flex flex-wrap gap-2">
              <Chip
                v-for="ph in items"
                :key="ph.token"
                :label="ph.token"
                class="placeholder-chip"
                v-tooltip.top="ph.description + ' (напр. ' + ph.example + ')'"
                @click="insert(ph.token)"
              />
            </div>
          </div>
          <Message severity="info" :closable="false" class="mt-2">
            Длительность: <b>{{ period.duration }}</b> строкой или <b>{{ period.seconds }}</b> секунд — зависит от плагина. UUID принимают
            LuckPerms/PowerRanks, остальные — по нику.
          </Message>
        </Panel>
      </div>
    </div>

    <template #footer>
      <Button label="Отмена" icon="pi pi-times" class="p-button-text" @click="$emit('update:visible', false)" />
      <Button :disabled="saving" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="save" />
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
      sections: [
        { title: 'Предметы', fields: [{ key: 'give_item', label: 'Выдать предмет' }] },
        {
          title: 'Группы / ранги',
          fields: [
            { key: 'group_add', label: 'Выдать группу (навсегда)' },
            { key: 'group_add_temp', label: 'Выдать группу (временно)' },
            { key: 'group_remove', label: 'Снять группу' },
          ],
        },
        {
          title: 'Права (пермишены)',
          fields: [
            { key: 'perm_set', label: 'Выдать право (навсегда)' },
            { key: 'perm_set_temp', label: 'Выдать право (временно)' },
            { key: 'perm_unset', label: 'Снять право' },
          ],
        },
      ],
      sample: {
        user: { username: 'Notch', uuid: '069a79f4-44e9-4726-a5be-fca90e38aaf5' },
        server: { id: 'hitech', name: 'HiTech', version: '1.12.2' },
        product: { id: 42, name: 'Алмаз', item_id: 'minecraft:diamond', nbt: '', amount: 64, price: 99 },
        group: { ingame_id: 'vip' },
        permission: { node: 'essentials.fly' },
        period: { seconds: 2592000 },
      },
    }
  },
  computed: {
    placeholderGroups() {
      return this.$_.groupBy(RCON_PLACEHOLDERS, 'group')
    },
    presetNote() {
      const found = RCON_PRESETS.find((p) => p.id === this.preset)
      return found ? found.note : ''
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
        this.$toast.add({ severity: 'success', detail: 'Шаблоны выдачи сохранены', life: 3000 })
        this.$emit('update:visible', false)
      } catch {
        this.$toast.add({ severity: 'error', detail: 'Не удалось сохранить шаблоны', life: 3000 })
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
