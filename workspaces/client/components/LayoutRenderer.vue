<template>
  <div class="layout-render" :class="[`layout-render--${place}`, definition.mode === 'html' && 'layout-render--html']">
    <template v-if="definition.mode === 'html'">
      <template v-for="(part, index) in parts" :key="index">
        <div v-if="part.kind === 'html'" class="layout-html" v-html="$sanitize(part.value)" />
        <LayoutBlock v-else :block="slotBlock(part.name)" :place="place" />
      </template>
    </template>

    <template v-else>
      <div v-for="row in definition.rows" :key="row.id" class="layout-row" :class="`layout-row--${row.align || 'between'}`">
        <LayoutBlock v-for="block in row.blocks" :key="block.id" :block="block" :place="place" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  LAYOUT_PLACEHOLDER_PATTERN,
  type LayoutBlock as Block,
  type LayoutDefinition,
  type LayoutPlace,
} from 'unicore-common/layout'
import { escapeHtml } from 'unicore-common/sanitize'
import { DEFAULT_LAYOUT } from 'unicore-common/layout-presets'

const props = defineProps<{ place: LayoutPlace; layout?: LayoutDefinition | null }>()

const { $pub } = useNuxtApp() as any

const store = useLayoutStore()

const definition = computed(() => props.layout || store.place(props.place))

type Part = { kind: 'html'; value: string } | { kind: 'slot'; name: string }

const source = computed(() => {
  const values: Record<string, string> = {
    sitename: String($pub.sitename || ''),
    year: String(new Date().getFullYear()),
  }

  return (definition.value.html || '').replace(new RegExp(LAYOUT_PLACEHOLDER_PATTERN.source, 'g'), (whole, name: string) =>
    name in values ? escapeHtml(values[name]) : whole,
  )
})

const parts = computed<Part[]>(() => {
  const pattern = new RegExp(LAYOUT_PLACEHOLDER_PATTERN.source, 'g')
  const result: Part[] = []
  let last = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(source.value))) {
    if (match.index > last) result.push({ kind: 'html', value: source.value.slice(last, match.index) })

    result.push({ kind: 'slot', name: match[1] })
    last = match.index + match[0].length
  }

  if (last < source.value.length) result.push({ kind: 'html', value: source.value.slice(last) })

  return result
})

const navFallback = computed(
  () => DEFAULT_LAYOUT[props.place].rows.flatMap((row: any) => row.blocks).find((block: any) => block.type === 'nav') || null,
)

function slotBlock(name: string): Block {
  const found = definition.value.rows.flatMap((row) => row.blocks).find((block) => block.type === name)

  if (found) return found
  if (name === 'nav' && navFallback.value) return navFallback.value

  return { id: `slot-${name}`, type: name as Block['type'] }
}
</script>

<style scoped>
.layout-render--header.layout-render--html {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  min-width: 0;
}
.layout-row,
.layout-render--html :deep(.layout-row) {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.layout-render--html :deep(.layout-row--start) {
  justify-content: flex-start;
}
.layout-render--html :deep(.layout-row--center) {
  justify-content: center;
}
.layout-render--html :deep(.layout-row--end) {
  justify-content: flex-end;
}
.layout-render--html :deep(.layout-row--between) {
  justify-content: space-between;
}
.layout-row--start {
  justify-content: flex-start;
}
.layout-row--center {
  justify-content: center;
}
.layout-row--end {
  justify-content: flex-end;
}
.layout-row--between {
  justify-content: space-between;
}
.layout-render--footer .layout-row {
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 24px;
}
.layout-render--footer .layout-row + .layout-row {
  margin-top: 24px;
}
.layout-html {
  display: contents;
}
</style>
