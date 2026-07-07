<template>
  <div>
    <Dialog class="buy-dialog" v-model:visible="giftDialog" modal v-if="gift">
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 class="mt-2 mb-0">Гифт-код активирован!</h4>
          <h3 class="mt-2 mb-0">Вы получили:</h3>
        </div>
      </template>
      <div class="text-center">
        <img height="100px" src="/images/chest-minecraft.gif" />
        <h4 v-if="gift.type == 'real'" class="m-0">{{ $utils.formatCurrency('real', gift.amount) }} на баланс</h4>
        <h4 v-if="gift.type == 'money'" class="m-0">
          {{ $utils.formatCurrency('ingame', gift.amount) }} монет на сервере {{ gift.server.name }}
        </h4>
        <h4 v-if="gift.type == 'donate'" class="m-0">
          Донат-группу "{{ gift.donate_group.name }}" ({{ gift.period.name }}) на сервере {{ gift.server.name }}
        </h4>
        <h4 v-if="gift.type == 'permission' && gift.donate_permission.type == 'web'" class="m-0">
          Донат-право "{{ gift.donate_permission.name }}" ({{ gift.period.name }})
        </h4>
        <h4 v-if="gift.type == 'permission' && gift.donate_permission.type != 'web'" class="m-0">
          Донат-право "{{ gift.donate_permission.name }}" ({{ gift.period.name }}) на сервере {{ gift.server.name }}
        </h4>
        <h4 v-if="gift.type == 'product' && gift.donate_permission != 'web'" class="m-0">
          Товар из магазина "{{ gift.product.name }}" ({{ gift.amount }} шт.) на сервере {{ gift.server.name }}
        </h4>
        <h4 v-if="gift.type == 'kit' && gift.donate_permission != 'web'" class="m-0">
          Кит из магазина "{{ gift.kit.name }}" на сервере {{ gift.server.name }}
        </h4>
      </div>
    </Dialog>
    <section class="px-4 pb-3">
      <h2 class="mt-0 mb-3">Гифт-коды</h2>
      <div class="row settings-split">
        <div class="col-xl-6 input-fw pe-xl-4 mb-4">
          <Form v-slot="{ meta }">
            <Field v-model="gift_code" name="гифт-код" rules="required" v-slot="{ value, errorMessage, handleChange, handleBlur }">
              <InputText
                :modelValue="value"
                @update:modelValue="handleChange"
                @blur="handleBlur"
                placeholder="Введите гифт-код"
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
              label="Активировать"
            />
          </Form>
        </div>
        <div class="col ps-xl-5">
          <h3 class="m-0">Где найти код?</h3>
          <p class="mt-1">Переодически мы публикуем коды в наших социальных сетях, чтобы не пропускать их, советуем подписаться.</p>
          <h3 class="m-0">Что содержат гифт-коды?</h3>
          <p class="mt-1">
            Активировав гифт-код вы можете получить деньги на баланс, монеты, игровые предметы или киты, а также донат-группы или
            донат-права
          </p>
        </div>
      </div>
    </section>
    <hr />
    <section class="px-4 mt-5">
      <h2 class="mt-0 mb-3">Голосование</h2>
      <div class="row settings-split">
        <div class="col-xl-6 input-fw pe-xl-4 mb-4">
          <table class="player-info-table w-100">
            <tr v-for="mon in monitorings" :key="mon">
              <td class="d-flex align-items-center py-2">
                <img width="30px" :src="monitorings_map[mon].icon" />
                <h4 class="m-0 ms-3" v-text="monitorings_map[mon].name" />
              </td>
              <td>
                <Button as="a" :href="config['public_link_' + mon]" class="w-full">Голосовать на {{ monitorings_map[mon].name }}</Button>
              </td>
            </tr>
          </table>
        </div>
        <div class="col ps-xl-5">
          <h3 class="mt-0 mb-3">Что вы получите, проголосовав в {{ monitorings.length }} рейтингах?</h3>
          <p class="mt-1">
            <b>Бонусы</b> - валюта за которую вы можете частично или полностью оплачивать товары из магазина, наборы ресурсов, донат-группы
            и донат-киты.
          </p>
          <div class="row">
            <div class="col-xl-6">
              <div class="mini-profile p-4 my-3 h-75">
                <h2 class="mt-0 mb-2">{{ $utils.formatCurrency('virtual', config.public_monitoring_reward * monitorings.length) }}</h2>
                <span>Бонусов</span>
              </div>
            </div>
            <div class="col-xl-6">
              <div class="mini-profile p-4 my-3 h-75">
                <h2 class="mt-0 mb-2">{{ monitorings.length }}</h2>
                <span>Очка в топе</span>
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

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'] })
useHead({ title: 'Личный кабинет' })

const { $api, $auth, $unicore } = useNuxtApp()
const recaptcha = useReCaptcha()
const config = computed(() => useConfigStore().config)

const monitorings_map = monitoringsMap
const monitorings = ref([])
const giftDialog = ref(false)
const gift = ref(null)
const loading = ref(false)
const gift_code = ref('')

onMounted(async () => {
  monitorings.value = await $api.get('cabinet/votes/monitorings').then((res) => res.data)
})

async function activateGift() {
  loading.value = true
  try {
    await recaptcha?.recaptchaLoaded?.()
    const token = await recaptcha?.executeRecaptcha?.('gift')
    gift.value = await $api
      .post(
        '/cabinet/gifts/activate',
        {
          gift_code: gift_code.value,
        },
        { headers: { recaptcha: token } },
      )
      .then((res) => res.data)

    if (gift.value.type == 'real') $auth.fetchUser()

    giftDialog.value = true
  } catch {
    $unicore.errorNotification('Указанный вами промокод не найден, либо вы уже активировали его')
  }
  loading.value = false
}
</script>
