<template>
  <div class="vh-100 vw-100 d-flex align-items-center justify-content-center error-layout">
    <div class="panel d-flex flex-column align-items-center justify-content-center px-5">
      <div class="d-flex align-items-center">
        <img class="my-1" src="/icon.png" height="64px" />
        <h2 class="ms-3 my-0 d-none d-md-block" v-text="$pub.sitename" />
      </div>

      <template v-if="failed">
        <h1>{{ $t('payment.fail_title') }}</h1>
        <p class="text-center m-0">{{ $t('payment.fail_text') }}</p>
      </template>

      <template v-else-if="pending">
        <h1>{{ $t('payment.pending_title') }}</h1>
        <p class="text-center m-0">{{ $t('payment.pending_text') }}</p>
        <ProgressBar mode="indeterminate" style="height: 0.4em" class="w-100 mt-3" />
      </template>

      <template v-else-if="payment">
        <h1>{{ $t('payment.success_title') }}</h1>
        <p class="text-center m-0">{{ $t('payment.success_text', { amount: $utils.formatCurrency('real', payment.amount) }) }}</p>
      </template>

      <template v-else>
        <h1>{{ $t('payment.success_title') }}</h1>
        <p class="text-center m-0">{{ $t('payment.success_plain') }}</p>
      </template>

      <NuxtLink to="/cabinet" class="mt-4">
        <Button text size="large"><i class="bx bx-left-arrow-alt"></i> {{ $t('payment.to_cabinet') }}</Button>
      </NuxtLink>
      <NuxtLink v-if="pending || failed" to="/cabinet/history" class="mt-1">
        <Button text size="large">{{ $t('payment.history') }}</Button>
      </NuxtLink>
    </div>
    <img class="header-render d-none d-lg-block" src="/images/render.png" />
  </div>
</template>

<script setup lang="ts">
import { PAYMENT_POLL_ATTEMPTS, PAYMENT_POLL_INTERVAL_MS } from '~/constants'

definePageMeta({ layout: 'empty' })

const { $api, $t } = useNuxtApp()
const route = useRoute()

if (!route.query.status) throw createError({ statusCode: 404, fatal: true })

const failed = route.query.status !== 'success'
const payment = ref<any>(null)
const pending = ref(false)

let timer: ReturnType<typeof setTimeout> | null = null
let attempts = 0

async function loadPayment() {
  payment.value = await $api
    .get('/payment/last', { params: { method: route.query.method } })
    .then((res: any) => res.data)
    .catch(() => null)

  pending.value = payment.value?.status === 'waiting'

  if (pending.value && attempts < PAYMENT_POLL_ATTEMPTS) {
    attempts++
    timer = setTimeout(loadPayment, PAYMENT_POLL_INTERVAL_MS)
  }
}

onMounted(() => {
  if (!failed) loadPayment()
})

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})

useHead({ title: failed ? $t('payment.fail_title') : $t('payment.success_title') })
</script>
