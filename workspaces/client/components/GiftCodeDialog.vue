<template>
  <Dialog v-model:visible="visible" class="buy-dialog" modal>
    <template #header>
      <h4 class="mt-2 mb-0">{{ $t('cabinet.gift_code_ready') }}</h4>
    </template>
    <p class="mt-0">{{ $t('cabinet.gift_code_ready_text') }}</p>
    <div class="d-flex align-items-center gap-2">
      <InputText :modelValue="giftsApi.code.value" readonly class="w-100 gift-code" />
      <Button v-tooltip.top="$t('cabinet.gift_copy')" severity="secondary" @click="copyCode()"><i class="bx bx-copy"></i></Button>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
const { $unicore, $t } = useNuxtApp()
const giftsApi = useGifts()
const { copy } = useClipboard({ legacy: true })

const visible = computed({
  get: () => !!giftsApi.code.value,
  set: (value: boolean) => {
    if (!value) giftsApi.code.value = ''
  },
})

async function copyCode() {
  await copy(giftsApi.code.value)
  $unicore.successNotification($t('cabinet.gift_code_copied'))
}
</script>
