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
              class="mt-3 w-100"
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
    <template v-if="myGifts.length">
      <hr />
      <section class="px-4 mt-5">
        <h2 class="mt-0 mb-3">{{ $t('cabinet.gift_my_title') }}</h2>
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
      </section>
    </template>
    <hr />
    <section class="px-4 mt-5">
      <h2 class="mt-0 mb-3">{{ $t('panel.vote') }}</h2>
      <div class="row settings-split">
        <div class="col-xl-6 input-fw pe-xl-4 mb-4">
          <table class="player-info-table w-100">
            <tbody>
              <tr v-for="mon in monitorings" :key="mon">
                <td class="d-flex align-items-center py-2">
                  <img width="30px" :src="monitorings_map[mon].icon" />
                  <h4 class="m-0 ms-3" v-text="monitorings_map[mon].name" />
                </td>
                <td>
                  <Button as="a" :href="config['public_link_' + mon]" class="w-100">
                    {{ $t('cabinet.vote_on', { monitoring: monitorings_map[mon].name }) }}
                  </Button>
                </td>
              </tr>
            </tbody>
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

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_gifts' })

const { $auth, $unicore, $t, $moment } = useNuxtApp()

const cabinet = useCabinet()
const votesApi = useVotes()
const giftsApi = useGifts()

useHead({ title: computed(() => $t('header.cabinet')) })
const recaptcha = useReCaptcha()
const { config } = usePublicConfig()

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
  await navigator.clipboard.writeText(code)
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
