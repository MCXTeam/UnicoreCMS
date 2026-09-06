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

        <div class="mb-2 flex align-items-center gap-2">
          <h5 class="m-0">{{ $t('admin.layout_preview') }}</h5>
          <LocaleEditorBar
            v-model="locale"
            :locales="locales.map((item: any) => item.code)"
            :status="{}"
            :isDefault="locale === defaultLocale"
          />
        </div>
        <LayoutPreview :definition="current" :place="place" :active="selected?.id" @pick="pick" />
      </div>
    </div>

    <div class="col-12 lg:col-7">
      <div class="card">
        <div class="flex justify-content-between align-items-center mb-3">
          <h5 class="m-0">{{ $t('admin.layout_title') }}</h5>
          <Button :label="$t('admin.layout_row_add')" icon="pi pi-plus" text :disabled="!canUpdate" @click="addRow()" />
        </div>

        <p v-if="current.mode === 'html'" class="text-color-secondary">{{ $t('admin.layout_mode_hint') }}</p>
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
                v-model="row.align"
                :options="alignments"
                optionLabel="name"
                optionValue="value"
                class="w-10rem"
                :disabled="!canUpdate"
                appendTo="body"
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

            <div class="layout-blocks">
              <button
                v-for="(block, blockIndex) in row.blocks"
                :key="block.id"
                type="button"
                class="layout-chip"
                :class="{ 'layout-chip--active': selected?.id === block.id }"
                @click="pick(block.id)"
              >
                <i :class="blockIcon(block.type)" />
                <span>{{ blockName(block.type) }}</span>
                <i class="pi pi-arrow-left layout-chip__move" v-if="blockIndex" @click.stop="moveBlock(row, blockIndex, -1)" />
                <i
                  class="pi pi-arrow-right layout-chip__move"
                  v-if="blockIndex < row.blocks.length - 1"
                  @click.stop="moveBlock(row, blockIndex, 1)"
                />
                <i class="pi pi-times layout-chip__move" @click.stop="removeBlock(row, blockIndex)" />
              </button>
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
      <div class="card layout-editor" v-if="selected">
        <div class="flex justify-content-between align-items-center mb-3">
          <h5 class="m-0">{{ blockName(selected.type) }}</h5>
          <Button icon="pi pi-times" text rounded @click="selected = null" />
        </div>

        <div class="field" v-if="hasTitle">
          <label>{{ $t('admin.layout_block_title') }}</label>
          <InputText :modelValue="selected.title?.[locale]" @update:modelValue="(v) => setText('title', v ?? '')" :disabled="!canUpdate" />
        </div>

        <div class="field" v-if="selected.type === 'text'">
          <label>{{ $t('admin.layout_text') }}</label>
          <Textarea :modelValue="selected.text?.[locale]" @update:modelValue="(v) => setText('text', v ?? '')" rows="4" :disabled="!canUpdate" />
        </div>

        <div class="field" v-if="selected.type === 'html'">
          <label>HTML</label>
          <Textarea v-model="selected.html" rows="6" class="font-monospace" :disabled="!canUpdate" />
        </div>

        <div class="field" v-if="selected.type === 'image' || selected.type === 'logo'">
          <label>{{ $t('admin.layout_image') }}</label>
          <InputText v-model="selected.image" placeholder="/icon.png" :disabled="!canUpdate" />
        </div>

        <div class="field" v-if="selected.type === 'image'">
          <label>{{ $t('admin.layout_link_url') }}</label>
          <InputText v-model="selected.href" :disabled="!canUpdate" />
        </div>

        <div class="field" v-if="hasSize">
          <label>{{ $t('admin.layout_size') }}</label>
          <InputNumber v-model="selected.size" :min="8" :max="400" :disabled="!canUpdate" />
        </div>

        <div class="field" v-if="selected.type === 'nav'">
          <label>{{ $t('admin.layout_columns') }}</label>
          <InputNumber v-model="selected.columns" :min="1" :max="4" :disabled="!canUpdate" />
        </div>

        <div class="field">
          <label>{{ $t('admin.layout_visibility') }}</label>
          <Select v-model="selected.when" :options="visibility" optionLabel="name" optionValue="value" :disabled="!canUpdate" appendTo="body" />
        </div>

        <div class="field">
          <label>{{ $t('admin.layout_hide_on') }}</label>
          <MultiSelect
            v-model="selected.hideOn"
            :options="screens"
            optionLabel="name"
            optionValue="value"
            display="chip"
            :disabled="!canUpdate"
            appendTo="body"
          />
        </div>

        <div class="field-checkbox">
          <Checkbox :binary="true" v-model="selected.grow" inputId="layout-grow" :disabled="!canUpdate" />
          <label for="layout-grow">{{ $t('admin.layout_grow') }}</label>
        </div>

        <template v-if="hasLinks">
          <div class="flex justify-content-between align-items-center mb-2">
            <b>{{ $t('admin.layout_links') }}</b>
            <Button :label="$t('admin.layout_link_add')" icon="pi pi-plus" text size="small" :disabled="!canUpdate" @click="addLink()" />
          </div>
          <div v-for="(link, index) in selected.links || []" :key="link.id" class="layout-link-row">
            <InputText
              class="flex-grow-1"
              :placeholder="$t('admin.layout_link_label')"
              :modelValue="link.labelKey ? messages[link.labelKey] : link.label?.[locale]"
              :disabled="!canUpdate || !!link.labelKey"
              @update:modelValue="(v) => setLinkLabel(link, v ?? '')"
            />
            <InputText class="flex-grow-1" :placeholder="$t('admin.layout_link_url')" v-model="link.to" :disabled="!canUpdate" />
            <InputText class="w-8rem" :placeholder="$t('admin.layout_link_icon')" v-model="link.icon" :disabled="!canUpdate" />
            <Button icon="pi pi-trash" text rounded severity="danger" :disabled="!canUpdate" @click="removeLink(index)" />
          </div>
        </template>
      </div>
      <div class="card" v-else>
        <p class="m-0 text-color-secondary">{{ $t('admin.layout_block_empty') }}</p>
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

  ;[row.blocks[index], row.blocks[next]] = [row.blocks[next], row.blocks[index]]
}

function setText(field: 'title' | 'text', value: string) {
  if (!selected.value) return

  selected.value[field] = { ...(selected.value[field] || {}), [locale.value]: value || '' }
}

function setLinkLabel(link: any, value: string) {
  link.label = { ...(link.label || {}), [locale.value]: value || '' }
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
}
.layout-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 999px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}
.layout-chip--active {
  border-color: var(--p-primary-color);
  color: var(--p-primary-color);
}
.layout-chip__move {
  opacity: 0.5;
  font-size: 0.75rem;
}
.layout-chip__move:hover {
  opacity: 1;
}
.layout-add {
  min-width: 12rem;
}
.layout-link-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.layout-editor .field {
  margin-bottom: 12px;
}
.font-monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
</style>
