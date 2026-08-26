<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <DataTable
          :value="items"
          :loading="loading"
          dataKey="id"
          rowHover
          responsiveLayout="scroll"
          lazy
          paginator
          :rows="pageSize"
          :totalRecords="total"
          :first="(page - 1) * pageSize"
          @page="onPage"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-2">
              <h5 class="m-0">{{ $t('mod.forms.inbox') }}</h5>
              <div class="flex gap-2">
                <Select
                  v-model="filters.form"
                  :options="forms"
                  optionLabel="title"
                  optionValue="id"
                  :placeholder="$t('mod.forms.filter_form')"
                  showClear
                  @change="reload()"
                />
                <Select
                  v-model="filters.status"
                  :options="statusOptions"
                  optionLabel="label"
                  optionValue="value"
                  :placeholder="$t('mod.forms.filter_status')"
                  showClear
                  @change="reload()"
                />
              </div>
            </div>
          </template>
          <template #empty>
            <div class="py-4 text-center">
              <p class="m-0">{{ $t(anyFilter ? 'mod.forms.inbox_nothing_found' : 'mod.forms.inbox_empty') }}</p>
              <small class="text-color-secondary">{{ $t(anyFilter ? 'mod.forms.inbox_nothing_found_hint' : 'mod.forms.inbox_empty_hint') }}</small>
            </div>
          </template>

          <Column :header="$t('mod.forms.received')" :style="{ width: '12rem' }">
            <template #body="{ data }">{{ $moment(data.created_at).format('DD.MM.YYYY HH:mm') }}</template>
          </Column>

          <Column :header="$t('mod.forms.form')">
            <template #body="{ data }">{{ data.form?.title }}</template>
          </Column>

          <Column :header="$t('mod.forms.author')" :style="{ width: '14rem' }">
            <template #body="{ data }">
              <span v-if="data.username">{{ data.username }}</span>
              <span v-else class="text-color-secondary">{{ $t('mod.forms.guest') }}</span>
              <div v-if="!data.user_uuid && data.email"><small class="text-color-secondary">{{ data.email }}</small></div>
            </template>
          </Column>

          <Column :header="$t('admin.status')" :style="{ width: '11rem' }">
            <template #body="{ data }">
              <Tag :severity="statusOf(data.status).severity" :value="$t(statusOf(data.status).label)" />
            </template>
          </Column>

          <Column :style="{ width: '5rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="{ data }">
              <Button icon="pi pi-eye" class="p-button-rounded p-button-success" @click="open(data)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="dialog" :header="current?.form?.title" :style="{ width: '640px' }" modal class="p-fluid">
      <div v-if="current" class="ff-view">
        <div class="ff-view__meta">
          <span>{{ current.username || $t('mod.forms.guest') }}</span>
          <span>{{ $moment(current.created_at).format('DD.MM.YYYY HH:mm') }}</span>
        </div>

        <dl class="ff-view__answers">
          <template v-for="answer in current.answers" :key="answer.key">
            <dt>{{ answer.label }}</dt>
            <dd>
              <a v-if="answer.type === 'file'" :href="String(answer.value)" target="_blank" rel="noopener">{{ $t('mod.forms.attached') }}</a>
              <span v-else>{{ readable(answer.value) }}</span>
            </dd>
          </template>
        </dl>

        <div class="field mt-4">
          <label>{{ $t('admin.status') }}</label>
          <Select
            v-model="review.status"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            :disabled="!canReview"
          />
        </div>

        <div class="field">
          <label class="flex align-items-center gap-1">
            {{ $t('mod.forms.review_comment') }}
            <i v-tooltip.right="$t('mod.forms.review_comment_hint')" class="pi pi-question-circle text-color-secondary" />
          </label>
          <Textarea v-model="review.comment" rows="3" :disabled="!canReview" autoResize />
        </div>
      </div>

      <template #footer>
        <Button
          :label="$t('admin.delete')"
          icon="pi pi-trash"
          class="p-button-text p-button-danger mr-auto"
          :disabled="!canReview"
          @click="remove()"
        />
        <Button :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="dialog = false" />
        <Button :label="$t('common.save')" icon="pi pi-check" class="p-button-text" :disabled="!canReview" @click="save()" />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { SUBMISSION_STATUSES, submissionStatus } from '../../../../shared/constants'

const PAGE_SIZE = 25

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('mod.forms.inbox')) })

    return { ...useAccess({ canReview: 'mod.forms.review' }) }
  },
  data() {
    return {
      items: [],
      forms: [],
      total: 0,
      page: 1,
      pageSize: PAGE_SIZE,
      loading: true,
      dialog: false,
      current: null,
      review: { status: 'new', comment: '' },
      filters: { form: null, status: null },
    }
  },
  computed: {
    anyFilter() {
      return Boolean(this.filters.form || this.filters.status)
    },
    statusOptions() {
      return SUBMISSION_STATUSES.map((item) => ({ ...item, label: this.$t(item.label) }))
    },
  },
  mounted() {
    this.filters.form = this.$route.query.form ? Number(this.$route.query.form) : null
    this.load()
  },
  methods: {
    statusOf(status) {
      return submissionStatus(status)
    },
    async load() {
      this.loading = true

      const [page, forms] = await Promise.all([
        this.$api
          .get('/mod/forms/manage/submissions', {
            params: { form: this.filters.form || undefined, status: this.filters.status || undefined, page: this.page },
          })
          .then((res) => res.data)
          .catch(() => ({ items: [], total: 0 })),
        this.forms.length ? Promise.resolve(this.forms) : this.$api.get('/mod/forms/manage').then((res) => res.data).catch(() => []),
      ])

      this.items = page.items
      this.total = page.total
      this.forms = forms
      this.loading = false
    },
    reload() {
      this.page = 1
      this.load()
    },
    onPage(event) {
      this.page = event.page + 1
      this.load()
    },
    open(submission) {
      this.current = submission
      this.review = { status: submission.status, comment: submission.comment || '' }
      this.dialog = true
    },
    readable(value) {
      if (Array.isArray(value)) return value.join(', ')
      if (typeof value === 'boolean') return this.$t(value ? 'mod.forms.yes' : 'mod.forms.no')

      return String(value ?? '')
    },
    async save() {
      const ok = await this.$api
        .patch(`/mod/forms/manage/submissions/${this.current.id}`, {
          status: this.review.status,
          comment: this.review.comment || undefined,
        })
        .then(() => true)
        .catch(() => false)

      if (!ok) return this.$utils.notifyError(null, this.$t('admin.invalid_data'))

      this.dialog = false
      this.$toast.add({ severity: 'success', detail: this.$t('mod.forms.review_saved'), life: 3000 })
      await this.load()
    },
    remove() {
      this.$confirm.require({
        header: this.$t('admin.confirm_delete'),
        message: this.$t('admin.irreversible'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          await this.$api.delete(`/mod/forms/manage/submissions/${this.current.id}`).catch(() => null)
          this.dialog = false
          await this.load()
        },
      })
    },
  },
}
</script>

<style scoped>
.ff-view__meta {
  display: flex;
  justify-content: space-between;
  color: var(--p-text-muted-color);
  font-size: 0.875rem;
}
.ff-view__answers {
  display: grid;
  grid-template-columns: minmax(140px, 32%) 1fr;
  gap: 0.35rem 1rem;
  margin: 1rem 0 0;
}
.ff-view__answers dt {
  color: var(--p-text-muted-color);
}
.ff-view__answers dd {
  margin: 0;
  overflow-wrap: anywhere;
}
</style>
