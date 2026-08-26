<template>
  <div v-if="canGift && modes.length && allowed !== false">
    <hr class="my-3" />
    <div class="d-flex align-items-center">
      <h4 class="m-0">{{ $t('cabinet.gift_title') }}</h4>
      <i v-tooltip.right="hint" class="bx bx-help-circle ms-2" />
    </div>
    <SelectButton
      v-if="modes.length > 1"
      v-model="mode"
      :options="modes"
      optionLabel="label"
      optionValue="value"
      :allowEmpty="false"
      class="mt-2"
    />
    <InputText
      v-if="mode == 'direct'"
      v-model="username"
      class="w-100 mt-2"
      :placeholder="$t('cabinet.gift_recipient_placeholder')"
      @keyup.enter="give()"
    />
    <Button :loading="loading" :disabled="disabled || !ready" outlined class="mt-3 w-100" @click="give()">
      <i class="bx bxs-gift me-1"></i> {{ $t('cabinet.gift_give_for', { price: $utils.formatCurrency('real', price) }) }}
    </Button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  payload: Record<string, unknown>
  price: number
  disabled?: boolean
  allowed?: boolean
}>()

const emit = defineEmits<{ done: [] }>()

const { $auth, $unicore, $t } = useNuxtApp()
const giftsApi = useGifts()

const { canGift } = useAccess({ canGift: 'player.gift.buy' })

const mode = ref<'direct' | 'code'>('direct')
const username = ref('')
const loading = ref(false)

const modes = computed(() =>
  [
    giftsApi.directEnabled.value ? { value: 'direct', label: $t('cabinet.gift_to_player') } : null,
    giftsApi.codeEnabled.value ? { value: 'code', label: $t('cabinet.gift_as_code') } : null,
  ].filter((item) => !!item),
)

const ready = computed(() => mode.value == 'code' || !!username.value.trim())
const hint = computed(() => $t(mode.value == 'code' ? 'cabinet.gift_hint_code' : 'cabinet.gift_hint_direct'))

watch(
  modes,
  (list) => {
    if (list.length && !list.find((item) => item?.value == mode.value)) mode.value = list[0]?.value as 'direct' | 'code'
  },
  { immediate: true },
)

async function give() {
  if (!ready.value || loading.value) return

  loading.value = true
  try {
    const result = await giftsApi.purchase({
      ...props.payload,
      recipient: mode.value == 'direct' ? username.value.trim() : undefined,
    })

    await $auth.fetchUser()

    if (result.promocode) giftsApi.showCode(result.promocode)
    else $unicore.successNotification($t('cabinet.gift_sent', { username: result.recipient }))

    username.value = ''
    emit('done')
  } catch (e: any) {
    $unicore.errorNotification(e.response?.data?.message || $t('cabinet.gift_error'))
  }
  loading.value = false
}
</script>
