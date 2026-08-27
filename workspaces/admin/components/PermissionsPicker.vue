<template>
  <div class="field permissions">
    <label v-if="label" class="flex align-items-center gap-1">
      <span>{{ label }}<span v-if="required" class="p-error"> *</span></span>
      <i v-tooltip.right="$t('admin.permissions_hint')" class="pi pi-question-circle text-color-secondary" />
    </label>

    <IconField class="permissions__search">
      <InputIcon class="pi pi-search" />
      <InputText v-model="query" :placeholder="$t('admin.permissions_search')" :disabled="disabled" />
    </IconField>

    <div class="permissions__list">
      <div v-for="group in visibleGroups" :key="group.group" class="permissions__group">
        <div class="permissions__group-head">
          <Checkbox
            :binary="true"
            :modelValue="groupState(group).all"
            :indeterminate="groupState(group).some"
            :disabled="disabled"
            @update:modelValue="toggleGroup(group)"
          />
          <span class="permissions__group-name">{{ group.label }}</span>
          <span class="permissions__group-count">{{ groupState(group).enabled }} / {{ groupState(group).total }}</span>
        </div>

        <div class="permissions__rows">
          <div v-for="entry in group.permissions" :key="entry.key" class="permissions__row">
            <Checkbox :binary="true" :modelValue="isOn(entry.key)" :disabled="disabled" @update:modelValue="toggle(entry.key)" />
            <span class="permissions__name" :class="{ 'permissions__name--covered': isCovered(entry.key) }">
              {{ label_(entry.key) }}
            </span>
            <i v-if="hint_(entry.key)" v-tooltip.right="hint_(entry.key)" class="pi pi-question-circle text-color-secondary" />
            <Tag v-if="entry.danger" severity="warn" :value="$t('admin.permission_danger')" v-tooltip.top="$t('admin.permission_danger_hint')" />
            <Tag v-else-if="isCovered(entry.key)" severity="secondary" :value="$t('admin.permission_covered')" />
            <button
              v-if="entry.scope === 'server' && isOn(entry.key)"
              type="button"
              class="permissions__scope"
              :disabled="disabled"
              v-tooltip.top="scopeHint(entry.key)"
              @click="openScope($event, entry.key)"
            >
              <Tag v-if="scopeValue(entry.key).length" severity="info" icon="pi pi-server" :value="scopeLabel(entry.key)" />
              <i v-else class="pi pi-server permissions__scope-icon" />
            </button>
          </div>
        </div>
      </div>

      <Popover ref="scopePanel">
        <div class="permissions__servers">
          <span class="permissions__servers-title">{{ $t('admin.permission_servers') }}</span>
          <label class="permissions__servers-row">
            <Checkbox :binary="true" :modelValue="!scopeValue(active).length" @update:modelValue="setScope(active, [])" />
            <span>{{ $t('admin.permission_servers_all') }}</span>
          </label>
          <label v-for="server in servers" :key="server.id" class="permissions__servers-row">
            <Checkbox :binary="true" :modelValue="scopeChecked(active, server.id)" @update:modelValue="toggleScope(server.id)" />
            <span>{{ server.name }}</span>
          </label>
        </div>
      </Popover>

      <p v-if="failed" class="permissions__empty">
        {{ $t('admin.permissions_failed') }}
        <Button :label="$t('admin.retry')" link size="small" @click="load(true)" />
      </p>
      <p v-else-if="!loaded" class="permissions__empty">{{ $t('admin.permissions_loading') }}</p>
      <p v-else-if="!visibleGroups.length" class="permissions__empty">{{ $t('admin.permissions_empty') }}</p>
    </div>

    <small v-show="error" class="p-error">{{ error }}</small>
  </div>
</template>

<script setup lang="ts">
import { isPlayerPermission, satisfiesPermission } from 'unicore-common/permissions'
import { usePermissionCatalog, type PermissionGroupView } from '~/composables/usePermissionCatalog'

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
    label?: string
    required?: boolean
    error?: string
    disabled?: boolean
    only?: 'panel' | 'player'
  }>(),
  { modelValue: () => [], label: '', required: false, error: '', disabled: false, only: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [string[]] }>()

const { $t } = useNuxtApp() as any
const { groups, servers, loaded, failed, load, label: label_, hint: hint_ } = usePermissionCatalog()

const query = ref('')
const active = ref('')
const scopePanel = ref()

onMounted(() => {
  load()
})

watch(
  () => props.modelValue,
  () => {
    if (failed.value) load(true)
  },
)

const patterns = computed<string[]>(() => props.modelValue || [])

const scoped = computed(() => groups.value.flatMap((group) => group.permissions).filter((entry) => entry.scope === 'server'))

const allowed = computed<PermissionGroupView[]>(() =>
  groups.value
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (entry) => !props.only || (props.only === 'player') === isPlayerPermission(entry.key),
      ),
    }))
    .filter((group) => group.permissions.length),
)

const visibleGroups = computed<PermissionGroupView[]>(() => {
  const search = query.value.trim().toLowerCase()

  if (!search) return allowed.value

  return allowed.value
    .map((group) => ({
      ...group,
      permissions: group.permissions.filter(
        (entry) => entry.key.toLowerCase().includes(search) || label_(entry.key).toLowerCase().includes(search),
      ),
    }))
    .filter((group) => group.permissions.length)
})

const known = computed(() => new Set(groups.value.flatMap((group) => group.permissions).map((entry) => entry.key)))

function scopeBase(key: string): string | null {
  if (known.value.has(key)) return null

  for (const entry of scoped.value) if (key.startsWith(`${entry.key}.`)) return entry.key

  return null
}

function isExplicit(key: string): boolean {
  return patterns.value.includes(key) || patterns.value.some((pattern) => scopeBase(pattern) === key)
}

function isOn(key: string): boolean {
  return isExplicit(key) || satisfiesPermission(patterns.value, key)
}

function isCovered(key: string): boolean {
  return !isExplicit(key) && satisfiesPermission(patterns.value, key)
}

function apply(next: string[]) {
  emit('update:modelValue', next)
}

function toggle(key: string) {
  if (props.disabled) return

  if (isOn(key)) {
    const next = patterns.value.filter((pattern) => pattern !== key && scopeBase(pattern) !== key)

    if (satisfiesPermission(next, key)) next.push(`!${key}`)

    apply(next)

    return
  }

  const next = patterns.value.filter((pattern) => pattern !== `!${key}`)

  if (!satisfiesPermission(next, key)) next.push(key)

  apply(next)
}

function fullGroup(group: PermissionGroupView): PermissionGroupView {
  return allowed.value.find((item) => item.group === group.group) || group
}

function groupState(group: PermissionGroupView) {
  const permissions = fullGroup(group).permissions
  const grantable = permissions.filter((entry) => !entry.danger)
  const enabled = permissions.filter((entry) => isOn(entry.key)).length
  const all = grantable.length > 0 && grantable.every((entry) => isOn(entry.key))

  return { total: permissions.length, enabled, all, some: !all && enabled > 0 }
}

function toggleGroup(group: PermissionGroupView) {
  const grantable = fullGroup(group).permissions.filter((entry) => !entry.danger)
  const turnOn = !groupState(group).all

  let next = [...patterns.value]

  for (const entry of grantable) {
    next = next.filter((pattern) => pattern !== entry.key && pattern !== `!${entry.key}` && scopeBase(pattern) !== entry.key)

    if (turnOn) next.push(entry.key)
    else if (satisfiesPermission(next, entry.key)) next.push(`!${entry.key}`)
  }

  apply(next)
}

function scopeValue(key: string): string[] {
  return patterns.value.filter((pattern) => scopeBase(pattern) === key).map((pattern) => pattern.slice(key.length + 1))
}

function scopeLabel(key: string): string {
  const ids = scopeValue(key)

  if (ids.length === 1) return servers.value.find((server) => server.id === ids[0])?.name || ids[0]

  return `${ids.length} / ${servers.value.length}`
}

function scopeHint(key: string): string {
  const ids = scopeValue(key)

  if (!ids.length) return $t('admin.permission_servers_all')

  return ids.map((id) => servers.value.find((server) => server.id === id)?.name || id).join(', ')
}

function scopeChecked(key: string, id: string): boolean {
  const ids = scopeValue(key)

  return !ids.length || ids.includes(id)
}

function openScope(event: Event, key: string) {
  if (props.disabled) return

  active.value = key
  scopePanel.value?.toggle(event)
}

function toggleScope(id: string) {
  const key = active.value
  const all = servers.value.map((server) => server.id)
  const current = scopeValue(key).length ? scopeValue(key) : all
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]

  if (!next.length) {
    toggle(key)
    scopePanel.value?.hide()

    return
  }

  setScope(key, next.length === all.length ? [] : next)
}

function setScope(key: string, ids: string[]) {
  const next = patterns.value.filter((pattern) => pattern !== key && scopeBase(pattern) !== key)

  if (!ids.length) next.push(key)
  else next.push(...ids.map((id) => `${key}.${id}`))

  apply(next)
}

</script>

<style scoped>
.permissions__search {
  display: block;
  margin-bottom: 0.75rem;
}
.permissions__search :deep(input) {
  width: 100%;
}
.permissions__list {
  max-height: 22rem;
  overflow: auto;
  border: 1px solid var(--p-content-border-color);
  border-radius: var(--p-content-border-radius);
  padding: 0.5rem 0.75rem;
}
.permissions__group + .permissions__group {
  margin-top: 1rem;
}
.permissions__group-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--p-content-border-color);
}
.permissions__group-name {
  font-weight: 600;
}
.permissions__group-count {
  margin-left: auto;
  color: var(--p-text-muted-color);
  font-variant-numeric: tabular-nums;
}
.permissions__rows {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.5rem;
}
.permissions__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.permissions__name--covered {
  color: var(--p-text-muted-color);
}
.permissions__scope {
  display: inline-flex;
  align-items: center;
  margin-left: auto;
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  cursor: pointer;
}
.permissions__scope:disabled {
  cursor: default;
}
.permissions__scope :deep(.p-tag) {
  cursor: inherit;
}
.permissions__scope-icon {
  color: var(--p-text-muted-color);
  transition: color 0.15s;
}
.permissions__scope:hover:not(:disabled) .permissions__scope-icon {
  color: var(--p-primary-color);
}
.permissions__servers {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 13rem;
}
.permissions__servers-title {
  color: var(--p-text-muted-color);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.permissions__servers-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.permissions__empty {
  margin: 0;
  color: var(--p-text-muted-color);
}
</style>
