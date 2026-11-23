<template>
  <section class="settings-panel" :aria-busy="loading || saving || uploading">
    <div class="settings-panel__tools">
      <IconField class="settings-panel__search"
        ><InputIcon class="pi pi-search" /><InputText
          v-model="search"
          :placeholder="$t('settings.search')"
          :aria-label="$t('settings.search')"
      /></IconField>
      <Button
        type="button"
        :label="$t('admin.refresh')"
        icon="pi pi-refresh"
        severity="secondary"
        outlined
        :disabled="loading || saving || uploading"
        @click="refresh"
      />
    </div>
    <Message v-if="error" severity="error" :closable="false" role="alert">{{ $t(error) }}</Message>
    <div v-if="loading && !catalog.fields.length" class="settings-panel__loading">
      <Skeleton height="3rem" /><Skeleton height="12rem" /><Skeleton height="8rem" />
    </div>
    <div v-else-if="catalog.fields.length" class="settings-panel__layout">
      <nav class="settings-panel__nav" :aria-label="$t('settings.categories')">
        <button
          v-for="category in catalog.categories"
          :key="category.id"
          type="button"
          :class="{ active: active === category.id && !search }"
          :aria-current="active === category.id && !search ? 'page' : undefined"
          @click="select(category.id)"
        >
          <i :class="category.icon || 'pi pi-sliders-h'" aria-hidden="true" /><span>{{ categoryLabel(category) }}</span
          ><span v-if="changedIn(category.id)" class="settings-panel__count">{{ changedIn(category.id) }}</span>
        </button>
      </nav>
      <div class="settings-panel__mobile-nav">
        <label :for="`${uid}-category`">{{ $t('settings.categories') }}</label>
        <Select
          :inputId="`${uid}-category`"
          :modelValue="active"
          :options="categoryOptions"
          optionLabel="label"
          optionValue="value"
          @update:modelValue="select($event)"
        />
      </div>
      <div class="settings-panel__content">
        <div v-if="!editable" class="settings-panel__readonly">
          <i class="pi pi-lock" aria-hidden="true" /> {{ $t('settings.readonly') }}
        </div>
        <div v-if="search && !visible.length" class="settings-panel__empty">
          <h2>{{ $t('settings.no_results') }}</h2>
          <p>{{ $t('settings.no_results_hint') }}</p>
          <Button :label="$t('settings.clear_search')" severity="secondary" outlined @click="search = ''" />
        </div>
        <section v-for="category in visible" :key="category.id" class="settings-panel__section">
          <header>
            <h2>{{ categoryLabel(category) }}</h2>
            <p v-if="category.hint">{{ $t(category.hint) }}</p>
          </header>
          <SettingField
            v-for="field in fieldsIn(category.id)"
            :key="field.key"
            :inputId="`${uid}-${field.key}`"
            v-model="draft[field.key]"
            :field="field"
            :disabled="!editable || loading || saving"
            :changed="isChanged(field)"
            :error="fieldErrors[field.key]"
            :technical="technical"
            @uploading="$event ? pendingUploads.add(field.key) : pendingUploads.delete(field.key)"
          />
        </section>
        <div class="settings-panel__technical">
          <Checkbox v-model="technical" :inputId="`${uid}-technical`" binary /><label :for="`${uid}-technical`">{{
            $t('settings.show_keys')
          }}</label>
        </div>
      </div>
    </div>
    <p v-else-if="!loading && !error" class="settings-panel__empty">{{ $t('settings.empty') }}</p>
    <footer class="settings-panel__footer">
      <span role="status" aria-live="polite">{{
        uploading
          ? $t('settings.uploading')
          : changes.length
            ? $t('settings.unsaved', { count: changes.length })
            : saved
              ? $t('settings.saved')
              : $t('settings.no_changes')
      }}</span>
      <div>
        <Button v-if="closable" :label="$t('settings.close')" severity="secondary" text :disabled="saving || uploading" @click="close" />
        <Button
          v-if="changes.length"
          :label="$t('settings.discard')"
          severity="secondary"
          outlined
          :disabled="saving || uploading"
          @click="discard"
        />
        <Button
          v-if="editable"
          :label="$t('common.save')"
          icon="pi pi-check"
          severity="success"
          :disabled="!changes.length || loading || uploading"
          :loading="saving"
          @click="save"
        />
      </div>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { settingIssue, type SettingsCatalog, type SettingsCategory, type SettingsField } from 'unicore-api'
import { useConfigStore } from '~/stores/config'
import { useLocale } from '~/composables/useLocale'
import { useConfirm } from 'primevue/useconfirm'
import { onBeforeRouteLeave } from 'vue-router'
import { isAxiosError } from 'axios'

const props = withDefaults(defineProps<{ catalogUrl?: string; saveUrl?: string; editable?: boolean; closable?: boolean }>(), {
  catalogUrl: '/config/settings',
  saveUrl: '/config/settings',
  editable: true,
})
const emit = defineEmits<{ close: []; saved: [] }>()
const { $api, $t } = useNuxtApp()
const locale = useLocale()
const confirm = useConfirm()
const uid = useId()
const catalog = ref<SettingsCatalog>({ categories: [], fields: [] })
const draft = reactive<Record<string, string | null>>({})
const search = ref('')
const active = ref('')
const technical = ref(false)
const loading = ref(false)
const saving = ref(false)
const pendingUploads = reactive(new Set<string>())
const uploading = computed(() => pendingUploads.size > 0)
const saved = ref(false)
const error = ref('')
const fieldErrors = ref<Record<string, string>>({})
const categoryLabel = (category: SettingsCategory) =>
  typeof category.label === 'string'
    ? $t(category.label)
    : category.label[locale.value] || category.label.en || category.label.ru || Object.values(category.label)[0]
const categoryOptions = computed(() => catalog.value.categories.map((category) => ({ value: category.id, label: categoryLabel(category) })))
const isChanged = (field: SettingsField) => draft[field.key] !== field.value
const changes = computed(() =>
  catalog.value.fields.filter(isChanged).map((field) => ({ key: field.key, value: draft[field.key], expected: field.value })),
)
const changedIn = (category: string) => catalog.value.fields.filter((field) => field.category === category && isChanged(field)).length
const matches = (field: SettingsField) =>
  [field.key, field.label ? $t(field.label) : '', field.hint ? $t(field.hint) : '']
    .join(' ')
    .toLocaleLowerCase()
    .includes(search.value.trim().toLocaleLowerCase())
const fieldsIn = (category: string) =>
  catalog.value.fields.filter((field) => field.category === category && (!search.value.trim() || matches(field)))
const visible = computed(() =>
  catalog.value.categories.filter((category) => (search.value.trim() ? fieldsIn(category.id).length : category.id === active.value)),
)

function accept(value: SettingsCatalog) {
  catalog.value = value
  for (const field of value.fields) draft[field.key] = field.value
  if (!value.categories.some((category) => category.id === active.value)) active.value = value.categories[0]?.id || ''
  fieldErrors.value = {}
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    accept((await $api.get(props.catalogUrl)).data)
  } catch {
    error.value = 'settings.error.load'
  } finally {
    loading.value = false
  }
}

function confirmDiscard(): Promise<boolean> {
  if (!changes.value.length) return Promise.resolve(true)
  return new Promise((resolve) =>
    confirm.require({
      header: $t('settings.leave_title'),
      message: $t('settings.leave_message'),
      acceptLabel: $t('settings.discard'),
      rejectLabel: $t('settings.keep_editing'),
      acceptProps: { severity: 'danger' },
      rejectProps: { severity: 'secondary', outlined: true },
      accept: () => resolve(true),
      reject: () => resolve(false),
      onHide: () => resolve(false),
    }),
  )
}
async function refresh() {
  if (saving.value || uploading.value) return
  if (await confirmDiscard()) {
    saved.value = false
    await load()
  }
}
async function discard() {
  if (saving.value || uploading.value) return
  if (await confirmDiscard()) {
    accept(catalog.value)
    error.value = ''
    saved.value = false
  }
}
async function close() {
  if (!saving.value && !uploading.value && (await confirmDiscard())) emit('close')
}
function select(id: string) {
  active.value = id
  search.value = ''
}

async function save() {
  if (!props.editable || loading.value || saving.value || uploading.value || !changes.value.length) return
  fieldErrors.value = {}
  for (const change of changes.value) {
    const field = catalog.value.fields.find((item) => item.key === change.key)!
    const issue = settingIssue(field, change.value)
    if (issue) fieldErrors.value[field.key] = issue
  }
  if (Object.keys(fieldErrors.value).length) {
    revealError()
    return
  }
  saving.value = true
  error.value = ''
  try {
    accept((await $api.patch(props.saveUrl, { changes: changes.value })).data)
    saved.value = true
    emit('saved')
    await useConfigStore()
      .fetch()
      .catch(() => undefined)
  } catch (failure: unknown) {
    const response = isAxiosError<{ fields?: Record<string, string> }>(failure) ? failure.response : undefined
    fieldErrors.value = response?.data?.fields || {}
    error.value = response?.status === 409 ? 'settings.error.conflict' : 'settings.error.save'
    revealError()
  } finally {
    saving.value = false
  }
}
function revealError() {
  const field = catalog.value.fields.find((item) => fieldErrors.value[item.key])
  if (field) {
    select(field.category)
    void nextTick(() => document.getElementById(`${uid}-${field.key}`)?.focus())
  }
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (changes.value.length || uploading.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => {
  void load()
  window.addEventListener('beforeunload', beforeUnload)
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(() => (saving.value || uploading.value ? false : confirmDiscard()))
defineExpose({ close, saving })
</script>

<style scoped>
.settings-panel {
  min-width: 0;
}
.settings-panel__tools {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 24px;
}
.settings-panel__search {
  flex: 1;
  max-width: 520px;
}
.settings-panel__search :deep(input) {
  width: 100%;
}
.settings-panel__layout {
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  gap: 32px;
}
.settings-panel__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-self: start;
}
.settings-panel__nav button {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--p-text-muted-color);
  text-align: left;
  font: inherit;
  cursor: pointer;
  transition: background 150ms;
}
.settings-panel__nav button:hover {
  background: var(--p-content-hover-background);
}
.settings-panel__nav button.active {
  background: var(--p-primary-50);
  color: var(--p-primary-800);
  font-weight: 600;
}
:global(.dark) .settings-panel__nav button.active {
  background: var(--p-primary-950);
  color: var(--p-primary-200);
}
.settings-panel__nav button:focus-visible {
  outline: 2px solid var(--p-primary-color);
  outline-offset: 2px;
}
.settings-panel__nav button span {
  overflow-wrap: anywhere;
}
.settings-panel__count {
  margin-left: auto;
  font-size: 12px;
}
.settings-panel__content {
  min-width: 0;
}
.settings-panel__mobile-nav {
  display: none;
}
.settings-panel__section header {
  padding-bottom: 8px;
}
.settings-panel__section h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.settings-panel__section header p {
  margin: 8px 0 0;
  color: var(--p-text-muted-color);
  line-height: 1.5;
}
.settings-panel__section + .settings-panel__section {
  margin-top: 32px;
}
.settings-panel__technical {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 16px 0 24px;
  color: var(--p-text-muted-color);
  font-size: 14px;
}
.settings-panel__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: sticky;
  bottom: 0;
  z-index: 1;
  padding: 16px 0;
  border-top: 1px solid var(--p-content-border-color);
  background: var(--p-content-background);
}
.settings-panel__footer > span {
  color: var(--p-text-muted-color);
  font-size: 14px;
}
.settings-panel__footer > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.settings-panel__readonly {
  margin-bottom: 24px;
  color: var(--p-text-muted-color);
}
.settings-panel__loading {
  display: grid;
  gap: 24px;
}
.settings-panel__empty {
  padding: 32px 0;
}
@media (max-width: 1000px) {
  .settings-panel__layout {
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 24px;
  }
}
@media (max-width: 700px) {
  .settings-panel__layout {
    display: block;
  }
  .settings-panel__nav {
    display: none;
  }
  .settings-panel__mobile-nav {
    display: grid;
    gap: 8px;
    margin-bottom: 24px;
  }
  .settings-panel__tools {
    gap: 8px;
  }
  .settings-panel__tools > :deep(button .p-button-label) {
    display: none;
  }
  .settings-panel__footer {
    position: static;
  }
  .settings-panel__footer > div {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
