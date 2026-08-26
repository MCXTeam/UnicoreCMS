<template>
  <div class="ff-page">
    <div class="panel ff-card">
      <div class="ff-card__head">
        <i v-if="form?.icon" :class="form.icon"></i>
        <div>
          <h1 class="m-0">{{ form?.title }}</h1>
          <p v-if="form?.description" class="ff-card__lead">{{ form.description }}</p>
        </div>
      </div>

      <div v-if="sent" class="ff-state">
        <i class="bx bx-check-circle ff-state__icon ff-state__icon--ok"></i>
        <p class="m-0">{{ form?.success_text || $t('mod.forms.sent') }}</p>
        <NuxtLink v-if="loggedIn" to="/mod/forms/my" class="ff-state__link">{{ $t('mod.forms.my_title') }}</NuxtLink>
      </div>

      <div v-else-if="!available" class="ff-state">
        <i class="bx bx-lock-alt ff-state__icon"></i>
        <p class="m-0">{{ closedText }}</p>
        <NuxtLink v-if="view?.availability?.reason === 'auth'" to="/auth" class="ff-state__link">{{ $t('mod.forms.sign_in') }}</NuxtLink>
      </div>

      <form v-else class="ff-form" @submit.prevent="submit">
        <div class="ff-form__grid">
          <div v-for="field in shown" :key="field.key" class="ff-form__cell" :class="field.half && 'ff-form__cell--half'">
            <ModFormsField
              v-model="answers[field.key]"
              :field="field"
              :servers="view?.servers || []"
              :slug="slug"
              :error="errors[field.key]"
            />
          </div>
        </div>

        <div v-if="!loggedIn" class="ff-form__guest">
          <span class="ff-form__guest-title">{{ $t('mod.forms.guest_title') }}</span>
          <div class="ff-form__grid">
            <div v-for="field in guestFields" :key="field.key" class="ff-form__cell ff-form__cell--half">
              <ModFormsField v-model="guest[field.key]" :field="field" :servers="[]" :slug="slug" :error="errors[field.key]" />
            </div>
          </div>
        </div>

        <Message v-if="errors.__form" severity="error" :closable="false" class="mt-3">{{ $t(errors.__form) }}</Message>

        <div class="ff-form__foot">
          <Button type="submit" :label="form?.submit_label || $t('mod.forms.submit')" :loading="sending" size="large" />
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fieldType, GUEST_EMAIL, GUEST_NAME, visibleFields } from '../../../../shared/constants'
import type { AnswerValue, FormFieldShape } from '../../../../shared/constants'

definePageMeta({ layout: 'landing' })

const route = useRoute()
const slug = String(route.params.slug)
const { $api, $t, $moment } = useNuxtApp() as any

const { data } = await useAsyncData(`mod-forms-${slug}`, () =>
  $api.get(`/mod/forms/${slug}`).then((res: any) => res.data),
)

if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Форма не найдена', fatal: true })

const live = ref<any>(null)
const view = computed(() => live.value || data.value)

const form = computed(() => view.value?.form)
const fields = computed<FormFieldShape[]>(() => form.value?.fields || [])
const available = computed(() => Boolean(view.value?.availability?.open))
const loggedIn = computed(() => Boolean(view.value?.authorized))

async function reload() {
  live.value = await $api
    .get(`/mod/forms/${slug}`)
    .then((res: any) => res.data)
    .catch(() => null)
}

const answers = reactive<Record<string, AnswerValue>>({})
const errors = reactive<Record<string, string>>({})
const guest = reactive<Record<string, AnswerValue>>({ [GUEST_NAME]: null, [GUEST_EMAIL]: null })
const sending = ref(false)
const sent = ref(false)

const guestFields = computed<FormFieldShape[]>(() => {
  const list: FormFieldShape[] = [
    {
      key: GUEST_NAME,
      type: 'text',
      label: $t('mod.forms.guest_name'),
      hint: $t('mod.forms.guest_name_hint'),
      required: true,
      half: true,
      position: 0,
      settings: { max_length: 32 },
    },
  ]

  if (form.value?.notify_author)
    list.push({
      key: GUEST_EMAIL,
      type: 'email',
      label: $t('mod.forms.guest_email'),
      hint: $t('mod.forms.guest_email_hint'),
      required: true,
      half: true,
      position: 1,
    })

  return list
})

for (const field of fields.value) {
  const info = fieldType(field.type)

  if (!info.input) continue

  answers[field.key] = info.multi ? [] : ['checkbox', 'switch'].includes(field.type) ? false : null
}

const shown = computed(() => visibleFields(fields.value, answers))

const closedText = computed(() => {
  const reason = view.value?.availability?.reason
  const until = view.value?.availability?.until

  if (reason === 'cooldown' && until) return $t('mod.forms.closed_cooldown', { date: formatted(until) })
  if (reason === 'window' && until) return $t('mod.forms.closed_window_from', { date: formatted(until) })

  return form.value?.closed_text || $t(`mod.forms.closed_${reason || 'disabled'}`)
})

function formatted(value: string): string {
  return $moment(value).format('DD.MM.YYYY HH:mm')
}

onMounted(() => reload())

function payload(): Record<string, unknown> {
  return shown.value.reduce<Record<string, unknown>>((result, field) => {
    const value = answers[field.key]

    result[field.key] = value instanceof Date ? value.toISOString().slice(0, 10) : value

    return result
  }, {})
}

async function submit() {
  for (const key of Object.keys(errors)) delete errors[key]

  sending.value = true

  const failed = await $api
    .post(`/mod/forms/${slug}`, {
      answers: payload(),
      username: guest[GUEST_NAME] || undefined,
      email: guest[GUEST_EMAIL] || undefined,
    })
    .then(() => null)
    .catch((error: any) => error?.response?.data || {})

  sending.value = false

  if (!failed) {
    sent.value = true
    await reload()

    return
  }

  for (const [key, message] of Object.entries(failed.errors || {})) errors[key] = String(message)

  if (!failed.errors) errors.__form = 'mod.forms.error_send'
}

useHead({ title: computed(() => form.value?.title || $t('mod.forms.title')) })
</script>

<style scoped>
.ff-page {
  display: flex;
  justify-content: center;
}
.ff-card {
  width: 100%;
  max-width: 720px;
  padding: 28px;
}
.ff-card__head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 22px;
}
.ff-card__head i {
  font-size: 28px;
  color: rgb(var(--vs-primary));
  line-height: 1.2;
}
.ff-card__head h1 {
  font-size: 24px;
  line-height: 1.25;
}
.ff-card__lead {
  margin: 6px 0 0;
  color: rgba(var(--vs-text), 0.65);
  font-size: 14px;
  line-height: 1.5;
}
.ff-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}
.ff-form__cell {
  grid-column: span 2;
}
.ff-form__cell--half {
  grid-column: span 1;
}
.ff-form__guest {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(var(--vs-text), 0.1);
}
.ff-form__guest-title {
  display: block;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(var(--vs-text), 0.55);
}
.ff-form__foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
.ff-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
  text-align: center;
  color: rgba(var(--vs-text), 0.75);
}
.ff-state__icon {
  font-size: 40px;
  color: rgba(var(--vs-text), 0.4);
}
.ff-state__icon--ok {
  color: rgb(var(--vs-primary));
}
.ff-state__link {
  color: rgb(var(--vs-primary));
}
@media (max-width: 640px) {
  .ff-form__cell--half {
    grid-column: span 2;
  }
}
</style>
