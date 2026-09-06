<template>
  <div class="lp" :class="`lp--${place}`">
    <template v-if="definition.mode === 'html'">
      <div class="lp__html" v-html="html" />
    </template>
    <template v-else>
      <div v-for="row in definition.rows" :key="row.id" class="lp__row" :class="`lp__row--${row.align || 'between'}`">
        <div
          v-for="block in row.blocks"
          :key="block.id"
          class="lp__block"
          :class="{ 'lp__block--grow': block.grow, 'lp__block--active': block.id === active }"
          @click="$emit('pick', block.id)"
        >
          <template v-if="block.type === 'spacer'"><span class="lp__spacer" /></template>
          <template v-else-if="block.type === 'logo'">
            <img :src="block.image || '/icon.png'" :height="`${Math.min(block.size || 64, 48)}px`" />
            <b v-if="place === 'header'">{{ sitename }}</b>
          </template>
          <template v-else-if="block.type === 'image'">
            <img :src="block.image || '/icon.png'" :height="`${Math.min(block.size || 100, 64)}px`" />
          </template>
          <template v-else-if="block.type === 'text'">
            <div>
              <h4 v-if="text(block.title)" class="m-0 mb-1">{{ text(block.title) }}</h4>
              <div class="lp__text" v-html="substitute(text(block.text))" />
            </div>
          </template>
          <template v-else-if="block.type === 'html'"><div class="lp__text" v-html="block.html" /></template>
          <template v-else-if="block.type === 'nav' || block.type === 'icons'">
            <div>
              <h4 v-if="text(block.title)" class="m-0 mb-1">{{ text(block.title) }}</h4>
              <div class="lp__links" :style="block.columns && block.columns > 1 ? { columnCount: block.columns } : {}">
                <span v-for="link in block.links || []" :key="link.id" class="lp__link">
                  <i v-if="link.icon && !link.icon.includes('/')" :class="link.icon" />
                  {{ label(link) }}
                </span>
                <span v-if="!(block.links || []).length" class="lp__muted">{{ $t('admin.layout_link_add') }}</span>
              </div>
            </div>
          </template>
          <template v-else-if="block.type === 'login'"><span class="lp__btn lp__btn--text">{{ $t('header.login') }}</span></template>
          <template v-else-if="block.type === 'launcher'"><span class="lp__btn">{{ $t('header.start') }}</span></template>
          <template v-else-if="block.type === 'locale'"><span class="lp__pill">RU</span></template>
          <template v-else-if="block.type === 'theme'"><i class="bx bxs-moon lp__icon" /></template>
          <template v-else-if="block.type === 'online'">
            <span class="lp__dot" />{{ $t('header.online') }} <b>128</b>
          </template>
        </div>
        <span v-if="!row.blocks.length" class="lp__muted">{{ $t('admin.layout_block_empty') }}</span>
      </div>
      <p v-if="!definition.rows.length" class="lp__muted m-0">{{ $t('admin.layout_rows_empty') }}</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { layoutText, type LayoutDefinition, type LayoutLink, type LayoutPlace, type LayoutText } from 'unicore-common/layout'

const props = defineProps<{ definition: LayoutDefinition; place: LayoutPlace; active?: string }>()

defineEmits<{ pick: [string] }>()

const { $t } = useNuxtApp() as any
const locale = useLocale()
const messages = useMessages()
const config = useRuntimeConfig()

const sitename = computed(() => String(config.public.sitename || 'UnicoreCMS'))

const text = (value?: LayoutText) => layoutText(value, locale.value)

const substitute = (value: string) =>
  value.replace(/\{\{\s*sitename\s*\}\}/g, sitename.value).replace(/\{\{\s*year\s*\}\}/g, String(new Date().getFullYear()))

const label = (link: LayoutLink) => (link.labelKey ? messages.value[link.labelKey] || link.labelKey : text(link.label))

const html = computed(() =>
  substitute(
    (props.definition.html || '').replace(/\{\{\s*([a-z]+)\s*\}\}/g, (_, name: string) => `<span class="lp__slot">{{ ${name} }}</span>`),
  ),
)
</script>

<style scoped>
.lp {
  border: 1px dashed var(--p-content-border-color);
  border-radius: 12px;
  padding: 14px;
  background: var(--surface-card);
  overflow: hidden;
}
.lp__row {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex-wrap: wrap;
}
.lp--footer .lp__row {
  align-items: flex-start;
}
.lp__row + .lp__row {
  margin-top: 16px;
}
.lp__row--start {
  justify-content: flex-start;
}
.lp__row--center {
  justify-content: center;
}
.lp__row--end {
  justify-content: flex-end;
}
.lp__row--between {
  justify-content: space-between;
}
.lp__block {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  min-width: 0;
}
.lp__block:hover {
  border-color: var(--p-content-border-color);
}
.lp__block--active {
  border-color: var(--p-primary-color);
  background: color-mix(in srgb, var(--p-primary-color) 8%, transparent);
}
.lp__block--grow {
  flex: 1 1 0;
}
.lp__spacer {
  display: block;
  width: 40px;
  border-top: 2px dotted var(--p-content-border-color);
}
.lp__links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}
.lp__links[style*='column-count'] {
  display: block;
}
.lp__link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}
.lp__btn {
  padding: 6px 14px;
  border-radius: 8px;
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
  white-space: nowrap;
}
.lp__btn--text {
  background: transparent;
  color: inherit;
  border: 1px solid var(--p-content-border-color);
}
.lp__pill {
  padding: 4px 10px;
  border: 1px solid var(--p-content-border-color);
  border-radius: 8px;
}
.lp__icon {
  font-size: 1.3rem;
}
.lp__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ade80;
}
.lp__muted {
  opacity: 0.5;
  font-size: 0.9rem;
}
.lp__text :deep(p),
.lp__text :deep(h3) {
  margin: 0;
}
.lp__html :deep(.lp__slot) {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px dashed var(--p-primary-color);
  color: var(--p-primary-color);
  font-size: 0.85rem;
}
</style>
