<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template #start>
            <SelectButton v-model="place" :options="places" optionLabel="name" optionValue="value" :allowEmpty="false" />
          </template>
          <template #end>
            <SelectButton
              v-model="current.mode"
              :options="modes"
              optionLabel="name"
              optionValue="value"
              :allowEmpty="false"
              :disabled="!canUpdate"
              @update:modelValue="onModeChange"
            />
            <Select
              class="ms-2"
              v-model="preset"
              :options="presets"
              optionLabel="name"
              optionValue="id"
              :placeholder="$t('admin.layout_presets')"
              :disabled="!canUpdate"
              appendTo="body"
              showClear
              @update:modelValue="applyPreset"
            />
            <Button
              class="ms-2"
              :label="$t('common.save')"
              icon="pi pi-check"
              :loading="loading"
              :disabled="!canUpdate"
              @click="save()"
            />
          </template>
        </Toolbar>

        <div class="mb-3 flex align-items-center justify-content-between gap-2">
          <h5 class="m-0">{{ $t('admin.layout_preview') }}</h5>
          <Select
            v-if="locales.length > 1"
            v-model="locale"
            :options="locales"
            optionLabel="name"
            optionValue="code"
            class="w-12rem"
            appendTo="body"
          />
        </div>
        <LayoutPreview :definition="current" :place="place" :active="selected?.id" @pick="pick" />
      </div>
    </div>

    <div class="col-12 lg:col-7">
      <div class="card h-full">
        <div class="flex justify-content-between align-items-center mb-3">
          <h5 class="m-0">{{ $t('admin.layout_title') }}</h5>
          <Button :label="$t('admin.layout_row_add')" icon="pi pi-plus" text :disabled="!canUpdate" @click="addRow()" />
        </div>

        <p v-if="current.mode === 'html'" class="text-color-secondary">{{ $t('admin.layout_mode_hint') }}</p>
        <small v-else-if="canUpdate" class="block mb-3 text-color-secondary">{{ $t('admin.layout_drag_hint') }}</small>
        <Textarea
          v-if="current.mode === 'html'"
          v-model="current.html"
          rows="18"
          class="w-full font-monospace"
          :disabled="!canUpdate"
        />
        <small v-if="current.mode === 'html'" class="block mt-2 text-color-secondary">{{ $t('admin.layout_html_hint') }}</small>

        <template v-else>
          <p v-if="!current.rows.length" class="text-color-secondary">{{ $t('admin.layout_rows_empty') }}</p>
          <div v-for="(row, rowIndex) in current.rows" :key="row.id" class="layout-row-card">
            <div class="flex align-items-center gap-2 mb-2">
              <b>{{ $t('admin.layout_row') }} {{ rowIndex + 1 }}</b>
              <Select
                :modelValue="row.align || 'between'"
                :options="alignments"
                optionLabel="name"
                optionValue="value"
                class="w-13rem"
                :disabled="!canUpdate"
                appendTo="body"
                @update:modelValue="(value: any) => (row.align = value)"
              />
              <div class="flex-grow-1" />
              <Button icon="pi pi-arrow-up" text rounded :disabled="!canUpdate || !rowIndex" @click="moveRow(rowIndex, -1)" />
              <Button
                icon="pi pi-arrow-down"
                text
                rounded
                :disabled="!canUpdate || rowIndex === current.rows.length - 1"
                @click="moveRow(rowIndex, 1)"
              />
              <Button icon="pi pi-trash" text rounded severity="danger" :disabled="!canUpdate" @click="removeRow(rowIndex)" />
            </div>

            <div
              class="layout-blocks"
              :class="{ 'layout-blocks--drop': !row.blocks.length && dropsBefore(row, 0) }"
              @dragover="overRow(row, $event)"
              @drop.prevent="drop()"
            >
              <span v-if="!row.blocks.length" class="layout-blocks__empty">{{ $t('admin.layout_block_empty') }}</span>
              <div
                v-for="(block, blockIndex) in row.blocks"
                :key="block.id"
                class="layout-chip"
                :class="{
                  'layout-chip--active': selected?.id === block.id,
                  'layout-chip--dragging': dragging?.id === block.id,
                  'layout-chip--before': dropsBefore(row, blockIndex),
                  'layout-chip--after': dropsAfterLast(row, blockIndex),
                }"
                :draggable="canUpdate"
                @dragstart="startDrag(row, blockIndex, block.id, $event)"
                @dragover="overChip(row, blockIndex, $event)"
                @dragend="endDrag()"
                @drop.prevent.stop="drop()"
              >
                <button
                  type="button"
                  class="layout-chip__main"
                  @click="pick(block.id)"
                  @keydown.left.alt.prevent="moveBlock(row, blockIndex, -1)"
                  @keydown.right.alt.prevent="moveBlock(row, blockIndex, 1)"
                >
                  <i :class="blockIcon(block.type)" />
                  <span>{{ blockName(block.type) }}</span>
                </button>
                <button
                  v-if="canUpdate"
                  type="button"
                  class="layout-chip__remove"
                  :aria-label="$t('admin.delete')"
                  v-tooltip.top="$t('admin.delete')"
                  @click="removeBlock(row, blockIndex)"
                >
                  <i class="pi pi-times" />
                </button>
              </div>
              <Select
                :modelValue="null"
                :options="blockTypes"
                optionLabel="name"
                optionValue="value"
                :placeholder="$t('admin.layout_block_add')"
                class="layout-add"
                :disabled="!canUpdate"
                appendTo="body"
                @update:modelValue="(type: any) => addBlock(row, type)"
              />
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="col-12 lg:col-5">
      <div class="card layout-editor h-full p-fluid" v-if="selected">
        <div class="flex justify-content-between align-items-center mb-4">
          <div class="flex align-items-center gap-2">
            <i :class="blockIcon(selected.type)" class="layout-editor__icon" />
            <h5 class="m-0">{{ blockName(selected.type) }}</h5>
          </div>
          <Button icon="pi pi-times" text rounded @click="selected = null" />
        </div>

        <div class="layout-section" v-if="hasTitle || hasContent">
          <span class="layout-section__title">{{ $t('admin.layout_section_content') }}</span>

          <div class="field" v-if="hasTitle">
            <label>{{ $t('admin.layout_block_title') }}</label>
            <InputText :modelValue="selected.title?.[locale]" @update:modelValue="(v) => setText('title', v ?? '')" :disabled="!canUpdate" />
          </div>

          <div class="field" v-if="selected.type === 'text'">
            <label>{{ $t('admin.layout_text') }}</label>
            <Textarea
              :modelValue="selected.text?.[locale]"
              @update:modelValue="(v) => setText('text', v ?? '')"
              rows="4"
              autoResize
              :disabled="!canUpdate"
            />
          </div>

          <div class="field" v-if="selected.type === 'html'">
            <label>HTML</label>
            <Textarea v-model="selected.html" rows="6" class="font-monospace" :disabled="!canUpdate" />
          </div>

          <div class="field" v-if="selected.type === 'image' || selected.type === 'logo'">
            <label>{{ $t('admin.layout_image') }}</label>
            <InputText v-model="selected.image" placeholder="https://..." :disabled="!canUpdate" />
          </div>

          <div class="field" v-if="selected.type === 'image'">
            <label>{{ $t('admin.layout_link_url') }}</label>
            <InputText v-model="selected.href" placeholder="/" :disabled="!canUpdate" />
          </div>

          <div class="formgrid grid" v-if="hasSize || selected.type === 'nav'">
            <div class="field col" v-if="hasSize">
              <label>{{ $t('admin.layout_size') }}</label>
              <InputNumber v-model="selected.size" :min="8" :max="400" suffix=" px" :disabled="!canUpdate" />
            </div>
            <div class="field col" v-if="selected.type === 'nav'">
              <label>{{ $t('admin.layout_columns') }}</label>
              <InputNumber v-model="selected.columns" :min="1" :max="4" :disabled="!canUpdate" />
            </div>
          </div>
        </div>

        <div class="layout-section">
          <span class="layout-section__title">{{ $t('admin.layout_section_display') }}</span>

          <div class="formgrid grid">
            <div class="field col-12 md:col-6">
              <label>{{ $t('admin.layout_visibility') }}</label>
              <Select
                :modelValue="selected.when || 'always'"
                :options="visibility"
                optionLabel="name"
                optionValue="value"
                :disabled="!canUpdate"
                appendTo="body"
                @update:modelValue="(value: any) => (selected!.when = value)"
              />
            </div>
            <div class="field col-12 md:col-6">
              <label>{{ $t('admin.layout_hide_on') }}</label>
              <MultiSelect
                v-model="selected.hideOn"
                :options="screens"
                optionLabel="name"
                optionValue="value"
                display="chip"
                :placeholder="$t('admin.layout_hide_nowhere')"
                :disabled="!canUpdate"
                appendTo="body"
              />
            </div>
          </div>

          <div class="field-checkbox mb-0">
            <Checkbox :binary="true" v-model="selected.grow" inputId="layout-grow" :disabled="!canUpdate" />
            <label for="layout-grow" class="mb-0">{{ $t('admin.layout_grow') }}</label>
          </div>
        </div>

        <div class="layout-section" v-if="hasLinks">
          <div class="flex justify-content-between align-items-center mb-2">
            <span class="layout-section__title mb-0">{{ $t('admin.layout_links') }}</span>
            <Button :label="$t('admin.layout_link_add')" icon="pi pi-plus" text size="small" :disabled="!canUpdate" @click="addLink()" />
          </div>

          <p v-if="!(selected.links || []).length" class="m-0 text-color-secondary">{{ $t('admin.layout_links_empty') }}</p>

          <div v-else class="layout-links">
            <div class="layout-links__head">
              <span>{{ $t('admin.layout_link_label') }}</span>
              <span>{{ $t('admin.layout_link_url') }}</span>
              <span>{{ $t('admin.layout_link_icon') }}</span>
              <span />
            </div>
            <div v-for="(link, index) in selected.links || []" :key="link.id" class="layout-links__row">
              <InputText
                size="small"
                :modelValue="link.labelKey ? messages[link.labelKey] : link.label?.[locale]"
                :disabled="!canUpdate || !!link.labelKey"
                v-tooltip.top="link.labelKey ? $t('admin.layout_link_standard') : ''"
                @update:modelValue="(v) => setLinkLabel(link, v ?? '')"
              />
              <InputText
                size="small"
                :modelValue="link.configLink ? $t('admin.layout_link_from_config') : link.to || link.href"
                :disabled="!canUpdate || !!link.configLink"
                v-tooltip.top="link.configLink ? $t('admin.layout_link_config_hint') : ''"
                @update:modelValue="(v) => setLinkUrl(link, v ?? '')"
              />
              <InputText size="small" v-model="link.icon" placeholder="bx bx-link" :disabled="!canUpdate" />
              <Button icon="pi pi-trash" text rounded severity="danger" :disabled="!canUpdate" @click="removeLink(index)" />
            </div>
          </div>
        </div>
      </div>
      <div class="card layout-empty" v-else>
        <i class="pi pi-objects-column" />
        <p class="m-0">{{ $t('admin.layout_pick_block') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { DEFAULT_LAYOUT, layoutPresets, type LayoutPreset } from 'unicore-common/layout-presets'
import {
  LAYOUT_ALIGNMENTS,
  LAYOUT_BLOCK_TYPES,
  LAYOUT_SCREENS,
  LAYOUT_VISIBILITY,
  type LayoutBlock,
  type LayoutBlockType,
  type LayoutDefinition,
  type LayoutPlace,
  type LayoutRow,
  type LayoutState,
} from 'unicore-common/layout'

const { $t, $api } = useNuxtApp() as any
const toast = useToast()
const confirm = useConfirm()
const locales = useLocales()
const defaultLocale = useDefaultLocale()
const messages = useMessages()
const { canUpdate } = useAccess({ canUpdate: 'panel.layout.update' })

useHead({ title: computed(() => $t('admin.menu_layout')) })

const state = ref<LayoutState>(JSON.parse(JSON.stringify(DEFAULT_LAYOUT)))
const place = ref<LayoutPlace>('header')
const locale = ref(defaultLocale.value)
const selected = ref<LayoutBlock | null>(null)
const preset = ref<string | null>(null)
const loading = ref(false)
const dragging = ref<{ row: string; index: number; id: string } | null>(null)
const dropTarget = ref<{ row: string; index: number } | null>(null)

const current = computed(() => state.value[place.value])

const places = computed(() => [
  { value: 'header', name: $t('admin.layout_header') },
  { value: 'footer', name: $t('admin.layout_footer') },
])

const modes = computed(() => [
  { value: 'builder', name: $t('admin.layout_mode_builder') },
  { value: 'html', name: $t('admin.layout_mode_html') },
])

const alignments = computed(() => LAYOUT_ALIGNMENTS.map((value) => ({ value, name: $t(`admin.layout_align_${value}`) || value })))

const visibility = computed(() => LAYOUT_VISIBILITY.map((value) => ({ value, name: $t(`admin.layout_visibility_${value}`) })))

const screens = computed(() => LAYOUT_SCREENS.map((value) => ({ value, name: $t(`admin.layout_hide_${value}`) })))

const blockTypes = computed(() => LAYOUT_BLOCK_TYPES.map((value) => ({ value, name: blockName(value) })))

const presets = computed(() =>
  layoutPresets(place.value).map((item: LayoutPreset) => ({ id: item.id, name: messages.value[item.name] || item.name })),
)

const hasTitle = computed(() => selected.value && ['text', 'nav', 'icons'].includes(selected.value.type))
const hasLinks = computed(() => selected.value && ['nav', 'icons'].includes(selected.value.type))
const hasSize = computed(() => selected.value && ['logo', 'image', 'icons'].includes(selected.value.type))
const hasContent = computed(() => selected.value && ['text', 'html', 'image', 'logo', 'nav', 'icons'].includes(selected.value.type))

const ICONS: Record<string, string> = {
  logo: 'pi pi-image',
  nav: 'pi pi-list',
  text: 'pi pi-align-left',
  image: 'pi pi-image',
  icons: 'pi pi-share-alt',
  html: 'pi pi-code',
  login: 'pi pi-user',
  launcher: 'pi pi-download',
  locale: 'pi pi-globe',
  theme: 'pi pi-moon',
  online: 'pi pi-chart-line',
  spacer: 'pi pi-arrows-h',
}

const blockName = (type: LayoutBlockType) => $t(`admin.layout_block_${type}`)
const blockIcon = (type: LayoutBlockType) => ICONS[type] || 'pi pi-box'

const uid = () => Math.random().toString(36).slice(2, 10)

function pick(id: string) {
  selected.value = current.value.rows.flatMap((row) => row.blocks).find((block) => block.id === id) || null
}

function addRow() {
  current.value.rows.push({ id: uid(), align: 'between', blocks: [] })
}

function removeRow(index: number) {
  current.value.rows.splice(index, 1)
  selected.value = null
}

function moveRow(index: number, delta: number) {
  const rows = current.value.rows
  const next = index + delta

  ;[rows[index], rows[next]] = [rows[next], rows[index]]
}

function addBlock(row: LayoutRow, type: LayoutBlockType) {
  if (!type) return

  const block: LayoutBlock = { id: uid(), type, when: 'always', hideOn: [], links: [], title: {}, text: {} }

  row.blocks.push(block)
  selected.value = block
}

function removeBlock(row: LayoutRow, index: number) {
  const [removed] = row.blocks.splice(index, 1)

  if (selected.value?.id === removed.id) selected.value = null
}

function moveBlock(row: LayoutRow, index: number, delta: number) {
  const next = index + delta

  if (!canUpdate.value || next < 0 || next >= row.blocks.length) return

  ;[row.blocks[index], row.blocks[next]] = [row.blocks[next], row.blocks[index]]
}

function startDrag(row: LayoutRow, index: number, id: string, event: DragEvent) {
  if (!canUpdate.value) return

  dragging.value = { row: row.id, index, id }

  if (!event.dataTransfer) return

  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', id)
}

function markDrop(row: LayoutRow, index: number, event: DragEvent) {
  if (!dragging.value) return

  event.preventDefault()

  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'

  dropTarget.value = { row: row.id, index }
}

function overChip(row: LayoutRow, index: number, event: DragEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const after = event.clientX > rect.left + rect.width / 2

  markDrop(row, after ? index + 1 : index, event)
}

function overRow(row: LayoutRow, event: DragEvent) {
  if ((event.target as HTMLElement).closest('.layout-chip')) return

  markDrop(row, row.blocks.length, event)
}

function endDrag() {
  dragging.value = null
  dropTarget.value = null
}

function drop() {
  const from = dragging.value
  const to = dropTarget.value

  endDrag()

  if (!from || !to) return

  const source = current.value.rows.find((row) => row.id === from.row)
  const target = current.value.rows.find((row) => row.id === to.row)

  if (!source || !target) return

  const index = source === target && from.index < to.index ? to.index - 1 : to.index

  if (source === target && index === from.index) return

  const [moved] = source.blocks.splice(from.index, 1)

  target.blocks.splice(index, 0, moved)
}

const dropsBefore = (row: LayoutRow, index: number) => dropTarget.value?.row === row.id && dropTarget.value.index === index

const dropsAfterLast = (row: LayoutRow, index: number) => index === row.blocks.length - 1 && dropsBefore(row, row.blocks.length)

function setText(field: 'title' | 'text', value: string) {
  if (!selected.value) return

  selected.value[field] = { ...(selected.value[field] || {}), [locale.value]: value || '' }
}

function setLinkLabel(link: any, value: string) {
  link.label = { ...(link.label || {}), [locale.value]: value || '' }
}

function setLinkUrl(link: any, value: string) {
  if (/^https?:\/\//.test(value)) {
    link.href = value
    link.to = ''

    return
  }

  link.to = value
  link.href = ''
}

function addLink() {
  if (!selected.value) return

  selected.value.links = [...(selected.value.links || []), { id: uid(), label: {}, to: '', icon: '' }]
}

function removeLink(index: number) {
  selected.value?.links?.splice(index, 1)
}

function toHtml(definition: LayoutDefinition): string {
  const rows = definition.rows
    .map((row) => {
      const blocks = row.blocks
        .map((block) => {
          if (['login', 'launcher', 'locale', 'theme', 'online', 'nav', 'logo'].includes(block.type)) return `  {{${block.type}}}`
          if (block.type === 'text') return `  <div>${block.text?.[locale.value] || ''}</div>`
          if (block.type === 'html') return `  ${block.html || ''}`
          if (block.type === 'image') return `  <img src="${block.image || ''}" height="${block.size || 100}" />`
          if (block.type === 'icons')
            return `  <div class="icons">${(block.links || [])
              .map((link) => `<a href="${link.href || link.to || '#'}"><i class="${link.icon || ''}"></i></a>`)
              .join('')}</div>`

          return ''
        })
        .filter(Boolean)
        .join('\n')

      return `<div class="layout-row layout-row--${row.align || 'between'}">\n${blocks}\n</div>`
    })
    .join('\n')

  return rows
}

function onModeChange(mode: string) {
  if (mode !== 'html' || current.value.html) return

  current.value.html = toHtml(current.value)
}

function applyPreset(id: string | null) {
  if (!id) return

  const found = layoutPresets(place.value).find((item: LayoutPreset) => item.id === id)

  if (!found) return

  confirm.require({
    message: $t('admin.layout_preset_confirm'),
    header: presets.value.find((item: { id: string; name: string }) => item.id === id)?.name,
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      state.value[place.value] = JSON.parse(JSON.stringify(found.definition))
      selected.value = null
    },
    reject: () => {
      preset.value = null
    },
  })
}

async function load() {
  const data = await $api
    .get('/admin/layouts')
    .then((res: any) => res.data)
    .catch(() => null)

  if (data) state.value = { ...JSON.parse(JSON.stringify(DEFAULT_LAYOUT)), ...data }
}

async function save() {
  loading.value = true

  try {
    await $api.patch(`/admin/layouts/${place.value}`, current.value)
    toast.add({ severity: 'success', summary: $t('admin.layout_saved'), life: 3000 })
  } catch (error: any) {
    toast.add({ severity: 'error', summary: $t('admin.invalid_data'), detail: error.response?.data?.message, life: 5000 })
  }

  loading.value = false
}

watch(place, () => {
  selected.value = null
  preset.value = null
})

watch(defaultLocale, (value) => {
  if (value) locale.value = value
})

onMounted(load)
</script>

<style scoped>
.layout-row-card {
  border: 1px solid var(--p-content-border-color);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.layout-blocks {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  border-radius: 10px;
  transition: box-shadow 0.15s;
}
.layout-blocks--drop {
  box-shadow: 0 0 0 2px var(--p-primary-color);
}
.layout-blocks__empty {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}
.layout-chip {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  height: 36px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 10px;
  background: var(--surface-card);
  transition: border-color 0.15s, background 0.15s;
}
.layout-chip[draggable='true'] {
  cursor: grab;
}
.layout-chip[draggable='true']:active {
  cursor: grabbing;
}
.layout-chip:hover {
  border-color: var(--p-primary-color);
}
.layout-chip--active {
  border-color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 8%, var(--surface-card));
}
.layout-chip--dragging {
  opacity: 0.4;
}
.layout-chip--before::after,
.layout-chip--after::after {
  content: '';
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 3px;
  border-radius: 2px;
  background: var(--p-primary-color);
}
.layout-chip--before::after {
  left: -6px;
}
.layout-chip--after::after {
  right: -6px;
}
.layout-chip__main {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px 0 12px;
  border: none;
  border-radius: 9px 0 0 9px;
  background: transparent;
  color: inherit;
  cursor: inherit;
  font: inherit;
  line-height: 1;
  white-space: nowrap;
}
.layout-chip__main > i {
  font-size: 0.9rem;
  line-height: 1;
  color: var(--text-color-secondary);
}
.layout-chip--active .layout-chip__main,
.layout-chip--active .layout-chip__main > i {
  color: var(--p-primary-color);
}
.layout-chip__main:focus-visible {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}
.layout-chip__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  padding: 0;
  border: none;
  border-radius: 0 9px 9px 0;
  background: transparent;
  color: var(--text-color-secondary);
  cursor: pointer;
  font-size: 0.7rem;
  opacity: 0.5;
  transition: opacity 0.15s, color 0.15s;
}
.layout-chip:hover .layout-chip__remove {
  opacity: 1;
}
.layout-chip__remove:hover {
  color: var(--p-red-500, #ef4444);
}
.layout-add {
  min-width: 12rem;
}
.layout-section {
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--p-content-border-color);
}
.layout-section:last-child {
  padding-bottom: 0;
  margin-bottom: 0;
  border-bottom: none;
}
.layout-section__title {
  display: block;
  margin-bottom: 14px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}
.layout-editor__icon {
  font-size: 1.1rem;
  color: var(--p-primary-color);
}
.layout-links__head,
.layout-links__row {
  display: grid;
  grid-template-columns: 1.1fr 1.3fr 1.25fr 2.25rem;
  gap: 8px;
  align-items: center;
}
.layout-links__head {
  margin-bottom: 6px;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}
.layout-links__row :deep(.p-inputtext) {
  padding-inline: 8px;
  text-overflow: ellipsis;
}
.layout-links__row + .layout-links__row {
  margin-top: 8px;
}
.layout-editor .field {
  margin-bottom: 12px;
}
.layout-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  color: var(--text-color-secondary);
  text-align: center;
}
.layout-empty i {
  font-size: 2rem;
  opacity: 0.4;
}
.font-monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
