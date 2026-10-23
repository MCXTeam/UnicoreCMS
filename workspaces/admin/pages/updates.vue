<template>
  <section class="updates-page" :aria-busy="state.loading.value || state.pending.value">
    <div class="card">
      <div class="updates-toolbar">
        <h1>{{ $t('updates.title') }}</h1>
        <Button :label="$t('admin.refresh')" icon="pi pi-refresh" outlined :loading="state.loading.value" @click="state.refresh()" />
      </div>
      <Message v-if="state.error.value" severity="error" :closable="false" role="alert">{{ state.error.value }}</Message>
      <UpdaterSetup v-if="(!state.status.value.configured || (state.status.value.setup && state.status.value.setup.state !== 'ready')) && !state.loading.value" @connected="state.refresh()" />
      <template v-if="state.status.value.configured">
        <p>{{ $t('updates.description') }}</p>
        <dl v-if="state.status.value.installation" class="updates-versions">
          <div v-for="part in ['server', 'client', 'admin']" :key="part">
            <dt>{{ $t(`updates.part.${part}`) }}</dt>
            <dd>{{ state.status.value.installation.components[part].version }}</dd>
          </div>
        </dl>
        <div class="updates-actions">
          <Button :label="$t('updates.discover')" icon="pi pi-search" outlined :loading="state.busy.value" @click="state.discover()" />
          <label for="update-release">{{ $t('updates.release') }}</label>
          <Select
            id="update-release"
            v-model="release"
            :options="state.releases.value"
            optionLabel="name"
            optionValue="id"
            :placeholder="$t('updates.select_release')"
          />
        </div>
        <details v-if="releaseNotes" class="updates-release-notes">
          <summary>{{ $t('updates.release_notes') }}</summary>
          <pre>{{ releaseNotes }}</pre>
        </details>
        <template v-if="!state.status.value.installation && canPrepare">
          <p>{{ $t('updates.adopt_description') }}</p>
          <Button :label="$t('updates.compare_baseline')" :disabled="!release || blocked" @click="state.action('adopt', { release })" />
          <div v-if="state.adoption.value" class="updates-baseline">
            <p>{{ $t('updates.baseline_result', { matching: state.adoption.value.matching, total: state.adoption.value.total }) }}</p>
            <ul>
              <li v-for="path in state.adoption.value.changes" :key="path">{{ path }}</li>
            </ul>
            <Button
              :label="$t('updates.confirm_baseline')"
              :disabled="blocked"
              @click="state.action('adopt', { release, fingerprint: state.adoption.value.fingerprint })"
            />
          </div>
        </template>
        <template v-else-if="canPrepare">
          <fieldset class="updates-selection">
            <legend>{{ $t('updates.components') }}</legend>
            <label v-for="part in ['server', 'client', 'admin']" :key="part" :for="`update-${part}`"
              ><Checkbox v-model="selected" :inputId="`update-${part}`" :value="part" />{{ $t(`updates.part.${part}`) }}</label
            >
          </fieldset>
          <Button
            :label="$t('updates.prepare')"
            :disabled="!release || !selected.length || blocked || outstanding"
            @click="state.action('plan', { release, selected })"
          />
        </template>
      </template>
    </div>
    <div v-if="op" class="card">
      <div class="updates-toolbar">
        <h2>{{ $t('updates.plan') }} {{ op.manifest?.version }}</h2>
        <Tag :value="$t(`updates.state.${op.state}`)" />
      </div>
      <p v-if="state.pending.value" role="status" aria-live="polite">{{ $t('updates.working') }}</p>
      <Message v-if="op.failure" severity="error" :closable="false">{{ state.message(`updates.error.${op.failure}`) }}</Message>
      <Message v-for="problem in op.errors" :key="problem" severity="error" :closable="false"
        >{{ $t('updates.incompatible') }}. {{ state.message(`updates.error.${problem}`) }}</Message
      >
      <section v-if="op.artifacts?.length">
        <h3>{{ $t('updates.artifacts_title') }}</h3>
        <p>{{ $t('updates.artifacts_description') }}</p>
        <div v-for="artifact in op.artifacts" :key="artifact.part" class="updates-actions">
          <Checkbox
            v-model="acceptedArtifacts"
            :inputId="`artifact-${artifact.part}`"
            :value="artifact.part"
            :disabled="blocked || !canPrepare || !editable"
          /><label :for="`artifact-${artifact.part}`">{{ $t(`updates.part.${artifact.part}`) }}</label>
        </div>
        <Button
          v-if="canPrepare"
          class="mt-3"
          :label="$t('updates.artifacts_confirm')"
          severity="warn"
          outlined
          :disabled="blocked || !editable || op.state === 'needs_resolution'"
          @click="state.action('artifacts', { id: op.id, components: acceptedArtifacts })"
        />
      </section>
      <template v-if="op.extensions?.length">
        <h3>{{ $t('updates.extensions') }}</h3>
        <p>{{ $t('updates.extension_choice') }}</p>
        <div v-for="extension in op.extensions" :key="extension.id" class="updates-actions">
          <Checkbox
            v-model="disabled"
            :inputId="`disable-${extension.id}`"
            :value="extension.id"
            :disabled="!canPrepare || blocked"
          /><label :for="`disable-${extension.id}`">{{ extension.name }} ({{ extension.requires }})</label>
        </div>
        <Button
          v-if="canPrepare"
          :label="$t('updates.disable_selected')"
          :disabled="blocked || !editable"
          severity="warn"
          outlined
          @click="state.action('disable', { id: op.id, extensions: disabled })"
        />
      </template>
      <h3>{{ $t('updates.changes') }}</h3>
      <p v-if="!op.changes?.length">{{ $t('updates.no_changes') }}</p>
      <ul class="updates-files">
        <li v-for="change in op.changes" :key="change.path">
          <Button :label="change.path" text @click="openDiff(change.path)" /><Tag
            :severity="change.resolved ? 'secondary' : 'warn'"
            :value="$t(`updates.change.${change.kind}`)"
          />
        </li>
      </ul>
      <Message v-if="op.state === 'ready'" severity="warn" :closable="false">{{ $t('updates.install_notice') }}</Message>
      <div class="updates-actions" data-card-actions>
        <Button
          v-if="canPrepare && editable"
          :label="$t('updates.verify')"
          :disabled="blocked || op.state === 'needs_resolution' || !!op.errors?.length"
          @click="state.action('verify', { id: op.id })"
        />
        <Button
          v-if="canApply && op.state === 'ready'"
          :label="$t('updates.install')"
          :disabled="blocked"
          severity="warn"
          @click="confirmInstall = true"
        />
        <Button
          v-if="canPrepare && editable"
          :label="$t('updates.cancel')"
          :disabled="blocked"
          outlined
          @click="state.action('cancel', { id: op.id })"
        />
        <Button
          v-if="canRecover && op.recoverable"
          :label="$t('updates.recover')"
          :disabled="blocked"
          severity="danger"
          outlined
          @click="state.action('recover', { id: op.id })"
        />
      </div>
      <Message v-if="op.state === 'recovery_required'" severity="error" :closable="false">{{ $t('updates.manual_recovery') }}</Message>
    </div>
    <div v-if="state.status.value.operations.length > 1" class="card">
      <h2>{{ $t('updates.history') }}</h2>
      <ul class="updates-history">
        <li v-for="previous in state.status.value.operations.slice(1)" :key="previous.id">
          <span>{{ previous.manifest?.version }}</span>
          <time :datetime="previous.createdAt">{{ $moment(previous.createdAt).format('L LT') }}</time>
          <Tag :value="$t(`updates.state.${previous.state}`)" />
        </li>
      </ul>
    </div>
    <Dialog
      v-model:visible="confirmInstall"
      modal
      :header="$t('updates.install_title')"
      :style="{ width: '32rem', maxWidth: 'calc(100vw - 2rem)' }"
    >
      <p>{{ $t('updates.install_notice') }}</p>
      <template #footer
        ><Button :label="$t('updates.back')" text @click="confirmInstall = false" /><Button
          :label="$t('updates.install')"
          severity="warn"
          :disabled="blocked"
          @click="install()"
      /></template>
    </Dialog>
    <Dialog v-model:visible="diffVisible" modal :header="diffPath" class="updates-file-dialog" :style="{ width: '76rem', maxWidth: 'calc(100vw - 2rem)' }">
      <div v-if="diff" class="updates-diff">
        <section v-for="key in ['base', 'local', 'target']" :key="key">
          <h3>{{ $t(`updates.diff.${key}`) }}</h3>
          <pre>{{ display(diff[key]) }}</pre>
        </section>
      </div>
      <label for="update-result">{{ $t('updates.diff.result') }}</label>
      <Textarea
        id="update-result"
        v-model="result"
        class="updates-editor"
        :disabled="!canPrepare || !editable || binary"
        :rows="12"
        spellcheck="false"
      />
      <div class="updates-actions" data-card-actions>
        <Button
          v-if="canPrepare && editable"
          :label="$t('updates.keep_local')"
          outlined
          :disabled="blocked"
          @click="resolveDiff('local')"
        />
        <Button
          v-if="canPrepare && editable"
          :label="$t('updates.use_target')"
          outlined
          :disabled="blocked"
          @click="resolveDiff('target')"
        />
        <Button
          v-if="canPrepare && editable"
          :label="$t('updates.save_result')"
          :disabled="blocked || binary"
          @click="resolveDiff('manual')"
        />
      </div>
    </Dialog>
  </section>
</template>

<script setup lang="ts">
import { useUpdates } from '~/composables/useUpdates'
import { useAuthStore } from '~/stores/auth'
const { $api, $t } = useNuxtApp() as any
const state = useUpdates()
const op = state.operation
const release = ref('')
const releaseNotes = computed(() => state.releases.value.find((item: any) => item.id === release.value)?.notes || '')
const selected = ref(['server', 'client', 'admin'])
const disabled = ref<string[]>([])
const acceptedArtifacts = ref<string[]>([])
const confirmInstall = ref(false)
const diffVisible = ref(false)
const diffPath = ref('')
const diff = ref<any>(null)
const result = ref('')
const auth = useAuthStore()
const canPrepare = computed(() => auth.has('panel.updates.prepare'))
const canApply = computed(() => auth.has('panel.updates.apply'))
const canRecover = computed(() => auth.has('panel.updates.recover'))
const blocked = computed(() => state.busy.value || state.pending.value || (state.status.value.setup && state.status.value.setup.state !== 'ready'))
const editable = computed(() => ['planned', 'ready', 'needs_resolution', 'verification_failed'].includes(op.value?.state))
const outstanding = computed(() => op.value && !['completed', 'rolled_back', 'cancelled', 'failed'].includes(op.value.state))
const binary = computed(() => diff.value?.result && typeof diff.value.result !== 'string')
watch(
  () => op.value?.disabled,
  (value) => {
    disabled.value = value || []
  },
)
watch(
  () => op.value?.artifacts,
  (value) => {
    acceptedArtifacts.value = (value || []).filter((a: any) => a.accepted).map((a: any) => a.part)
  },
)
function display(value: any) {
  return value === null ? '∅' : typeof value === 'string' ? value : `[${value.bytes} bytes]`
}
async function openDiff(path: string) {
  try {
    const response = await $api.get('/admin/updates/diff', { params: { id: op.value.id, path } })
    diff.value = response.data
    diffPath.value = path
    result.value = typeof diff.value.result === 'string' ? diff.value.result : ''
    diffVisible.value = true
  } catch {
    state.error.value = $t('updates.operation_failed')
  }
}
async function resolveDiff(choice: string) {
  if (
    await state.action('resolve', { id: op.value.id, path: diffPath.value, choice, ...(choice === 'manual' ? { text: result.value } : {}) })
  )
    diffVisible.value = false
}
async function install() {
  confirmInstall.value = false
  await state.action('apply', { id: op.value.id, hash: op.value.planHash })
}
</script>

<style scoped>
.updates-page {
  display: grid;
  gap: 1.5rem;
  min-width: 0;
}
.updates-page h1 {
  font-size: 1.5rem;
  margin: 0;
}
.updates-page h2 {
  font-size: 1.25rem;
  margin: 0;
}
.updates-toolbar,
.updates-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.updates-toolbar {
  justify-content: space-between;
  margin-bottom: 1rem;
}
.updates-actions {
  margin-top: 1rem;
}
.updates-versions {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
}
.updates-versions dd {
  margin: 0.5rem 0 0;
}
.updates-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
}
.updates-selection label {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
.updates-files {
  padding: 0;
  list-style: none;
  max-height: 24rem;
  overflow: auto;
}
.updates-files li {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}
.updates-files :deep(.p-button-label) {
  overflow-wrap: anywhere;
  text-align: left;
}
.updates-diff {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}
:global(.updates-file-dialog .p-dialog-title) {
  min-width: 0;
  overflow-wrap: anywhere;
}
:global(.updates-file-dialog .p-dialog-header-actions) {
  flex-shrink: 0;
}
.updates-diff section {
  min-width: 0;
}
.updates-diff pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 24rem;
  overflow: auto;
  background: var(--surface-ground);
  padding: 1rem;
}
.updates-editor {
  display: block;
  width: 100%;
  margin-top: 0.5rem;
  font-family: monospace;
}
.updates-baseline ul {
  max-height: 16rem;
  overflow: auto;
  overflow-wrap: anywhere;
}
.updates-history {
  padding: 0;
  list-style: none;
}
.updates-release-notes pre {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  max-height: 24rem;
  overflow: auto;
}
.updates-history li {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}
@media (max-width: 768px) {
  .updates-diff {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
