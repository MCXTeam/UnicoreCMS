<template>
  <section>
    <div class="row px-4">
      <div class="col-xl-6 pe-xl-2">
        <div class="skin-view p-4">
          <div class="row">
            <div class="col-auto d-flex flex-column align-items-center">
              <SkinView3D class="rounded" :width="140" :height="200" :skin="$auth.user.skin" :cloak="$auth.user.cloak" ref="Skin3D" />
              <div class="skin-animation">
                <i @click="Skin3D.setAnimation(null)" class="bx bx-male"></i>
                <i @click="Skin3D.setAnimation('walk')" class="bx bx-walk"></i>
                <i @click="Skin3D.setAnimation('run')" class="bx bx-run"></i>
              </div>
            </div>
            <div class="col mt-4 mt-xxl-0">
              <div class="d-flex d-none d-xxl-flex justify-content-around skin-2d">
                <SkinView3D class="rounded" :width="75" :height="150" :skin="$auth.user.skin" :cloak="$auth.user.cloak" ref="SkinFront" />
                <SkinView3D class="rounded" :width="75" :height="150" :skin="$auth.user.skin" :cloak="$auth.user.cloak" ref="SkinBack" />
              </div>
              <div class="d-flex gap-2 mt-3">
                <input type="file" ref="skin" class="d-none" accept="image/png" @change="updateSkin()" />
                <Button @click="skin.click()" class="w-full" :loading="skinLoading" label="Загрузить скин" />
                <Button @click="deleteSkin()" severity="danger" class="w-25" :loading="skinLoading"><i class="bx bx-trash"></i></Button>
              </div>
              <div class="d-flex gap-2 mt-2">
                <input type="file" ref="cloak" class="d-none" accept="image/png" @change="updateCloak()" />
                <Button @click="cloak.click()" class="w-full" :loading="cloakLoading" label="Загрузить плащ" />
                <Button @click="deleteCloak()" severity="danger" class="w-25" :loading="cloakLoading"><i class="bx bx-trash"></i></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-6 px-4 mt-4 mt-xl-0 player-info">
        <h5 class="text-uppercase mt-0 d-none d-xl-block"><b>UUID:</b> {{ $auth.user.uuid }}</h5>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0">Сведения об аккаунте</h3>
          <NuxtLink :to="`/user/${$auth.user.username}`" class="d-none d-xl-block">
            <Button size="small"><i class="bx bx-link me-1"></i> Публичный профиль</Button>
          </NuxtLink>
        </div>
        <table class="player-info-table w-100">
          <tr>
            <td>Логин</td>
            <td v-text="$auth.user.username" />
          </tr>
          <tr>
            <td>Баланс бонусов</td>
            <td>{{ $utils.formatCurrency('virtual', $auth.user.virtual) }} <i class="bx bx-gift"></i></td>
          </tr>
          <tr>
            <td>Email</td>
            <td v-text="$auth.user.email || '-'" />
          </tr>
          <tr>
            <td>Регистрация</td>
            <td v-text="$moment($auth.user.created).format('D MMMM YYYY, HH:mm')" />
          </tr>
          <tr>
            <td>Стаж аккаунта</td>
            <td v-text="$moment.duration($moment() - $moment($auth.user.created)).format()" />
          </tr>
          <tr v-if="inviter">
            <td>Вас пригласил</td>
            <td v-text="inviter.inviter.username" />
          </tr>
        </table>
      </div>
    </div>
    <hr class="my-3" />
    <div class="row px-4">
      <div class="col-xl-8">
        <h2 class="m-0">Блокировки аккаунта</h2>
        <p>Информация об активных блокировках аккаунта, при блокировке вам недоступны некоторые разделы сайта и доступ к серверам.</p>
        <p v-if="!$auth.user.ban" class="text-success">Все круто, твой аккаунт не в бане!</p>
        <p v-if="$auth.user.ban && $auth.user.ban.expires" class="text-danger">
          Вы заблокированы до {{ $moment($auth.user.expires).format('DD.MM.YYYY, HH:mm:ss') }}!
        </p>
        <p v-if="$auth.user.ban && !$auth.user.ban.expires" class="text-danger">Вы заблокированы навсегда!</p>
      </div>
      <div class="col-xl-4 d-flex align-items-center">
        <Button class="w-full" size="large" :disabled="!$auth.user.ban" :loading="banLoading" @click="unabn()">
          Купить разбан за {{ $utils.formatCurrency('real', config.public_unban_price) }}
        </Button>
      </div>
    </div>
    <hr class="my-3" />
    <div class="px-4">
      <h2 class="m-0">Балансы валюты на серверах</h2>
      <p>
        Информация о балансе внутриигровой валюты на серверах. Обмен, перевод и пополненение осуществляется во вкладке
        <NuxtLink to="/cabinet/payment">“ПОПОЛНЕНИЕ И ПЕРЕВОД”</NuxtLink>
      </p>
      <div class="row mt-2" v-if="money">
        <div class="col-xl-4 d-flex align-items-center mb-3" v-for="m in money" :key="m.server.id">
          <Avatar v-if="m.server.icon" size="xlarge" :image="`${$pub.apiBaseurl}/${m.server.icon}`"> </Avatar>
          <Avatar v-else size="xlarge"> <i class="bx bxs-server"></i> </Avatar>
          <div class="ms-3">
            <h3 class="m-0" v-text="m.server.name" />
            <span>{{ $utils.formatCurrency('ingame', m.money) }} монет</span>
          </div>
        </div>
      </div>
      <div class="row mt-2" v-else>
        <div class="col-xl-4 d-flex align-items-center mb-3" v-for="(n, index) in 3" :key="index">
          <Skeleton size="4rem"></Skeleton>
          <div class="ms-3" style="flex: 1">
            <Skeleton width="100%" class="mb-2"></Skeleton>
            <Skeleton width="75%"></Skeleton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useConfigStore } from '~/stores/config'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'] })
useHead({ title: 'Личный кабинет' })

const { $api, $auth, $unicore } = useNuxtApp()
const config = computed(() => useConfigStore().config)

const Skin3D = ref(null)
const SkinFront = ref(null)
const SkinBack = ref(null)
const skin = ref(null)
const cloak = ref(null)

const inviter = ref(null)
const money = ref(null)
const skinLoading = ref(false)
const cloakLoading = ref(false)
const banLoading = ref(false)

onMounted(async () => {
  Skin3D.value.viewer.playerObject.rotation.set(0, 0.3, 0)

  SkinFront.value.viewer.controls.enableRotate = false

  SkinBack.value.viewer.controls.enableRotate = false
  SkinBack.value.viewer.playerObject.rotation.set(0, 3.15, 0)

  money.value = await $api.get('/cabinet/money/me').then((res) => res.data)
  try {
    inviter.value = await $api.get('/cabinet/referals/me/inviter').then((res) => res.data)
  } catch {}
})

async function updateSkin() {
  skinLoading.value = true
  const skinData = new FormData()
  skinData.append('file', skin.value.files[0])

  try {
    await $api.patch('/cabinet/skin/skin', skinData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    await $auth.fetchUser()
    $unicore.successNotification('Ваш скин был обновлён!')
  } catch (e) {
    if (e.response?.status == 415) $unicore.errorNotification('Файл не является скином Minecraft')
  }

  skin.value.value = null
  skinLoading.value = false
}

async function updateCloak() {
  cloakLoading.value = true
  const cloakData = new FormData()
  cloakData.append('file', cloak.value.files[0])

  try {
    await $api.patch('/cabinet/skin/cloak', cloakData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    await $auth.fetchUser()
    $unicore.successNotification('Ваш плащ был обновлён!')
  } catch (e) {
    if (e.response?.status == 415) $unicore.errorNotification('Файл не является плащом Minecraft')
  }

  cloak.value.value = null
  cloakLoading.value = false
}

async function deleteSkin() {
  skinLoading.value = true
  try {
    await $api.delete('/cabinet/skin/skin')
    await $auth.fetchUser()
    $unicore.successNotification('Ваш скин был удалён!')
  } catch {}
  skinLoading.value = false
}

async function deleteCloak() {
  cloakLoading.value = true
  try {
    await $api.delete('/cabinet/skin/cloak')
    await $auth.fetchUser()
    $unicore.successNotification('Ваш плащ был удалён!')
  } catch {}
  cloakLoading.value = false
}

async function unabn() {
  banLoading.value = true
  try {
    await $api.post('/bans/unban')
    await $auth.fetchUser()
    $unicore.successNotification('Ваш аккаунт был разблокирован!')
  } catch {
    $unicore.errorNotification('На балансе недостаточно денег для покупки разбана!')
  }
  banLoading.value = false
}
</script>
