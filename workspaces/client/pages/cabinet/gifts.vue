<template>
  <div>
    <Dialog class="buy-dialog" v-model:visible="giftDialog" modal v-if="gift">
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 class="mt-2 mb-0">{{ $t('cabinet.gift_activated') }}</h4>
          <h3 class="mt-2 mb-0">{{ $t('cabinet.gift_you_got') }}</h3>
        </div>
      </template>
      <div class="text-center">
        <img height="100px" src="/images/chest-minecraft.gif" />
        <h4 class="m-0">{{ giftsApi.describe(gift) }}</h4>
      </div>
    </Dialog>
    <div class="cab-grid">
      <CabTile v-if="canActivate" :title="$t('cabinet.gift_codes')" icon="bx bx-gift" :span="6">
        <Form v-slot="{ meta }" class="cab-form">
          <Field
            v-model="gift_code"
            :name="$t('cabinet.gift_code')"
            rules="required"
            v-slot="{ value, errorMessage, handleChange, handleBlur }"
          >
            <InputText
              :modelValue="value"
              @update:modelValue="handleChange"
              @blur="handleBlur"
              :placeholder="$t('cabinet.gift_code_placeholder')"
              class="w-100"
            />
            <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
          </Field>
          <Button :loading="loading" :disabled="!meta.valid" class="w-100" :label="$t('cabinet.activate')" @click="activateGift()" />
        </Form>
      </CabTile>

      <CabTile :title="$t('cabinet.gift_what_title')" icon="bx bx-help-circle" :span="6">
        <p class="cab-sub mt-0 mb-3">{{ $t('cabinet.gift_what_text') }}</p>
        <h5 class="cab-section">{{ $t('cabinet.gift_where_title') }}</h5>
        <p class="cab-sub m-0">{{ $t('cabinet.gift_where_text') }}</p>
      </CabTile>
      <CabTile v-if="myGifts.length" :title="$t('cabinet.gift_my_title')" icon="bx bx-purchase-tag" :span="12">
        <DataTable class="no-overflow-table" :value="myGifts">
          <Column :header="$t('cabinet.gift_my_what')">
            <template #body="{ data }">{{ giftsApi.describe(data) }}</template>
          </Column>
          <Column :header="$t('cabinet.gift_code_column')">
            <template #body="{ data }">
              <div class="d-flex align-items-center">
                <span class="gift-code" v-text="data.promocode" />
                <Button v-tooltip.top="$t('cabinet.gift_copy')" size="small" text @click="copyCode(data.promocode)">
                  <i class="bx bx-copy"></i>
                </Button>
              </div>
            </template>
          </Column>
          <Column :header="$t('cabinet.gift_my_status')">
            <template #body="{ data }">{{ giftStatus(data) }}</template>
          </Column>
          <Column :header="$t('cabinet.gift_my_created')">
            <template #body="{ data }">{{ $moment(data.created).format('D MMMM YYYY, HH:mm') }}</template>
          </Column>
        </DataTable>
      </CabTile>

      <CabTile :title="$t('panel.vote')" icon="bx bx-party" :span="7">
        <div v-if="monitorings.length" class="cab-servers">
          <div v-for="mon in monitorings" :key="mon" class="cab-servers__row">
            <img class="cab-mon__icon" :src="monitorings_map[mon].icon" />
            <div>
              <h4 v-text="monitorings_map[mon].name" />
              <span>{{
                $t('cabinet.vote_reward_once', { amount: $utils.formatCurrency('virtual', config.public_monitoring_reward) })
              }}</span>
            </div>
            <Button class="ms-auto" size="small" as="a" :href="config['public_link_' + mon]" :label="$t('cabinet.vote')" />
          </div>
        </div>
        <div v-else class="cab-empty">
          <i class="bx bx-party"></i>
          <span>{{ $t('cabinet.monitorings_empty') }}</span>
        </div>
      </CabTile>

      <CabTile :title="$t('cabinet.vote_reward_title', { count: monitorings.length })" icon="bx bx-medal" :span="5">
        <p class="cab-sub mt-0 mb-3">{{ $t('cabinet.vote_reward_text') }}</p>
        <div class="cab-metrics">
          <div class="cab-metrics__item">
            <span class="cab-metrics__label">{{ $t('cabinet.bonuses') }}</span>
            <span class="cab-metrics__value">
              {{ $utils.formatCurrency('virtual', config.public_monitoring_reward * monitorings.length) }}
            </span>
          </div>
          <div class="cab-metrics__item">
            <span class="cab-metrics__label">{{ $t('cabinet.top_points') }}</span>
            <span class="cab-metrics__value cab-metrics__value--soft" v-text="monitorings.length" />
          </div>
        </div>
      </CabTile>
    </div>
  </div>
</template>

<script setup>
import { Form, Field } from 'vee-validate'
import { useReCaptcha } from 'vue-recaptcha-v3'
import monitoringsMap from '~/json/monitorings.json'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_gifts', hint: 'cabinet.gifts_hint' })

const { $auth, $unicore, $t, $moment } = useNuxtApp()

const cabinet = useCabinet()
const votesApi = useVotes()
const giftsApi = useGifts()
const { copy } = useClipboard({ legacy: true })

useHead({ title: computed(() => $t('header.cabinet')) })
const recaptcha = useReCaptcha()
const { config } = usePublicConfig()

const { canActivate } = useAccess({ canActivate: 'player.gift.activate' })

const monitorings_map = monitoringsMap
const monitorings = ref([])
const myGifts = ref([])
const giftDialog = ref(false)
const gift = ref(null)
const loading = ref(false)
const gift_code = ref('')

onMounted(async () => {
  monitorings.value = await votesApi.monitorings()
  myGifts.value = await giftsApi.mine().catch(() => [])
})

function giftStatus(item) {
  if (item.activations?.length) return $t('cabinet.gift_status_used')
  if (item.expires && $moment(item.expires).isBefore()) return $t('cabinet.gift_status_expired')

  return $t('cabinet.gift_status_new')
}

async function copyCode(code) {
  await copy(code)
  $unicore.successNotification($t('cabinet.gift_code_copied'))
}

async function activateGift() {
  loading.value = true
  try {
    await recaptcha?.recaptchaLoaded?.()
    const token = await recaptcha?.executeRecaptcha?.('gift')
    gift.value = await cabinet.activateGift(gift_code.value, token)

    if (gift.value.type == 'real') $auth.fetchUser()

    giftDialog.value = true
  } catch {
    $unicore.errorNotification($t('cabinet.gift_not_found'))
  }
  loading.value = false
}
</script>
