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
        <h4 v-if="gift.type == 'real'" class="m-0">
          {{ $t('cabinet.referal_to_balance', { amount: $utils.formatCurrency('real', gift.amount) }) }}
        </h4>
        <h4 v-if="gift.type == 'money'" class="m-0">
          {{ $t('cabinet.gift_money', { amount: $utils.formatCurrency('ingame', gift.amount), server: gift.server.name }) }}
        </h4>
        <h4 v-if="gift.type == 'donate'" class="m-0">
          {{ $t('cabinet.gift_donate', { name: gift.donate_group.name, period: gift.period.name, server: gift.server.name }) }}
        </h4>
        <h4 v-if="gift.type == 'permission' && gift.donate_permission.type == 'web'" class="m-0">
          {{ $t('cabinet.gift_permission_web', { name: gift.donate_permission.name, period: gift.period.name }) }}
        </h4>
        <h4 v-if="gift.type == 'permission' && gift.donate_permission.type != 'web'" class="m-0">
          {{ $t('cabinet.gift_permission', { name: gift.donate_permission.name, period: gift.period.name, server: gift.server.name }) }}
        </h4>
        <h4 v-if="gift.type == 'product' && gift.donate_permission != 'web'" class="m-0">
          {{ $t('cabinet.gift_product', { name: gift.product.name, amount: gift.amount, server: gift.server.name }) }}
        </h4>
        <h4 v-if="gift.type == 'kit' && gift.donate_permission != 'web'" class="m-0">
          {{ $t('cabinet.gift_kit', { name: gift.kit.name, server: gift.server.name }) }}
        </h4>
      </div>
    </Dialog>
    <section class="px-4 pb-3">
      <h2 class="mt-0 mb-3">{{ $t('cabinet.gift_codes') }}</h2>
      <div class="row settings-split">
        <div class="col-xl-6 input-fw pe-xl-4 mb-4">
          <Form v-slot="{ meta }">
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
            <Button
              :loading="loading"
              @click="activateGift()"
              :disabled="!meta.valid"
              class="mt-3 w-full"
              size="large"
              :label="$t('cabinet.activate')"
            />
          </Form>
        </div>
        <div class="col ps-xl-5">
          <h3 class="m-0">{{ $t('cabinet.gift_where_title') }}</h3>
          <p class="mt-1">{{ $t('cabinet.gift_where_text') }}</p>
          <h3 class="m-0">{{ $t('cabinet.gift_what_title') }}</h3>
          <p class="mt-1">{{ $t('cabinet.gift_what_text') }}</p>
        </div>
      </div>
    </section>
    <hr />
    <section class="px-4 mt-5">
      <h2 class="mt-0 mb-3">{{ $t('panel.vote') }}</h2>
      <div class="row settings-split">
        <div class="col-xl-6 input-fw pe-xl-4 mb-4">
          <table class="player-info-table w-100">
            <tr v-for="mon in monitorings" :key="mon">
              <td class="d-flex align-items-center py-2">
                <img width="30px" :src="monitorings_map[mon].icon" />
                <h4 class="m-0 ms-3" v-text="monitorings_map[mon].name" />
              </td>
              <td>
                <Button as="a" :href="config['public_link_' + mon]" class="w-full">
                  {{ $t('cabinet.vote_on', { monitoring: monitorings_map[mon].name }) }}
                </Button>
              </td>
            </tr>
          </table>
        </div>
        <div class="col ps-xl-5">
          <h3 class="mt-0 mb-3">{{ $t('cabinet.vote_reward_title', { count: monitorings.length }) }}</h3>
          <p class="mt-1">{{ $t('cabinet.vote_reward_text') }}</p>
          <div class="row">
            <div class="col-xl-6">
              <div class="mini-profile p-4 my-3 h-75">
                <h2 class="mt-0 mb-2">{{ $utils.formatCurrency('virtual', config.public_monitoring_reward * monitorings.length) }}</h2>
                <span>{{ $t('cabinet.bonuses') }}</span>
              </div>
            </div>
            <div class="col-xl-6">
              <div class="mini-profile p-4 my-3 h-75">
                <h2 class="mt-0 mb-2">{{ monitorings.length }}</h2>
                <span>{{ $t('cabinet.top_points') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { Form, Field } from 'vee-validate'
import { useReCaptcha } from 'vue-recaptcha-v3'
import monitoringsMap from '~/json/monitorings.json'
import { useConfigStore } from '~/stores/config'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_gifts' })

const { $auth, $unicore, $t } = useNuxtApp()

const cabinet = useCabinet()
const votesApi = useVotes()

useHead({ title: computed(() => $t('header.cabinet')) })
const recaptcha = useReCaptcha()
const config = computed(() => useConfigStore().config)

const monitorings_map = monitoringsMap
const monitorings = ref([])
const giftDialog = ref(false)
const gift = ref(null)
const loading = ref(false)
const gift_code = ref('')

onMounted(async () => {
  monitorings.value = await votesApi.monitorings()
})

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
