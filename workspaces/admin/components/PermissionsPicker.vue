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
            <MultiSelect
              v-if="entry.scope === 'server' && isOn(entry.key)"
              class="permissions__scope"
              :modelValue="scopeValue(entry.key)"
              :options="servers"
              optionLabel="name"
              optionValue="id"
              display="chip"
              :maxSelectedLabels="2"
              :disabled="disabled"
              :placeholder="$t('admin.permission_servers_all')"
              appendTo="body"
              @update:modelValue="setScope(entry.key, $event)"
            />
          </div>
        </div>
      </div>

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

function scopeBase(key: string): string | null {
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
  margin-left: auto;
  max-width: 18rem;
}
.permissions__empty {
  margin: 0;
  color: var(--p-text-muted-color);
}
</style>
