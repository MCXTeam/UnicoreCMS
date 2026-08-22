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
                <Button @click="skin.click()" class="w-full" :loading="skinLoading" :label="$t('cabinet.upload_skin')" />
                <Button @click="deleteSkin()" severity="danger" class="w-25" :loading="skinLoading"><i class="bx bx-trash"></i></Button>
              </div>
              <div class="d-flex gap-2 mt-2">
                <input type="file" ref="cloak" class="d-none" accept="image/png" @change="updateCloak()" />
                <Button @click="cloak.click()" class="w-full" :loading="cloakLoading" :label="$t('cabinet.upload_cloak')" />
                <Button @click="deleteCloak()" severity="danger" class="w-25" :loading="cloakLoading"><i class="bx bx-trash"></i></Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="col-xl-6 px-4 mt-4 mt-xl-0 player-info">
        <h5 class="text-uppercase mt-0 d-none d-xl-block"><b>UUID:</b> {{ $auth.user.uuid }}</h5>
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h3 class="m-0">{{ $t('profile.account_info') }}</h3>
          <NuxtLink :to="`/user/${$auth.user.username}`" class="d-none d-xl-block">
            <Button size="small"><i class="bx bx-link me-1"></i> {{ $t('cabinet.public_profile') }}</Button>
          </NuxtLink>
        </div>
        <table class="player-info-table w-100">
          <tbody>
            <tr>
              <td>{{ $t('profile.login') }}</td>
              <td v-text="$auth.user.username" />
            </tr>
            <tr>
              <td>{{ $t('cabinet.bonus_balance') }}</td>
              <td>{{ $utils.formatCurrency('virtual', $auth.user.virtual) }} <i class="bx bx-gift"></i></td>
            </tr>
            <tr>
              <td>Email</td>
              <td v-text="$auth.user.email || '-'" />
            </tr>
            <tr>
              <td>{{ $t('profile.registered') }}</td>
              <td v-text="$moment($auth.user.created).format('D MMMM YYYY, HH:mm')" />
            </tr>
            <tr>
              <td>{{ $t('profile.account_age') }}</td>
              <td v-text="$utils.formatDuration($moment() - $moment($auth.user.created), 'milliseconds')" />
            </tr>
            <tr v-if="inviter">
              <td>{{ $t('cabinet.invited_by') }}</td>
              <td v-text="inviter.inviter.username" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <hr class="my-3" />
    <div class="row px-4">
      <div class="col-xl-8">
        <h2 class="m-0">{{ $t('cabinet.bans_title') }}</h2>
        <p>{{ $t('cabinet.bans_hint') }}</p>
        <p v-if="!$auth.user.ban" class="text-success">{{ $t('cabinet.ban_none') }}</p>
        <p v-if="$auth.user.ban && $auth.user.ban.expires" class="text-danger">
          {{ $t('cabinet.ban_until', { date: $moment($auth.user.expires).format('DD.MM.YYYY, HH:mm:ss') }) }}
        </p>
        <p v-if="$auth.user.ban && !$auth.user.ban.expires" class="text-danger">{{ $t('cabinet.ban_forever') }}</p>
      </div>
      <div class="col-xl-4 d-flex align-items-center">
        <Button class="w-full" size="large" :disabled="!$auth.user.ban" :loading="banLoading" @click="unabn()">
          {{ $t('cabinet.buy_unban', { price: $utils.formatCurrency('real', config.public_unban_price) }) }}
        </Button>
      </div>
    </div>
    <hr class="my-3" />
    <div class="px-4">
      <h2 class="m-0">{{ $t('cabinet.ingame_balances') }}</h2>
      <p>
        {{ $t('cabinet.ingame_balances_hint') }}
        <NuxtLink to="/cabinet/payment">{{ $t('cabinet.tab_payment') }}</NuxtLink>
      </p>
      <div class="row mt-2" v-if="money">
        <div class="col-xl-4 d-flex align-items-center mb-3" v-for="m in money" :key="m.server.id">
          <IconAvatar :path="m.server.icon" size="xlarge" icon="bx bxs-server" />
          <div class="ms-3">
            <h3 class="m-0" v-text="m.server.name" />
            <span>{{ $t('cabinet.coins', { amount: $utils.formatCurrency('ingame', m.money) }) }}</span>
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
    <ExtensionSlot name="cabinet.index" />
</template>

<script setup>

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_general' })

const { $auth, $unicore, $t } = useNuxtApp()

const cabinet = useCabinet()
const moneyApi = useMoney()
const skinApi = useSkin()

useHead({ title: computed(() => $t('header.cabinet')) })
const { config } = usePublicConfig()

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

  money.value = await moneyApi.balance()
  try {
    inviter.value = await cabinet.inviter()
  } catch {}
})

async function updateSkin() {
  skinLoading.value = true
  const skinData = new FormData()
  skinData.append('file', skin.value.files[0])

  try {
    await skinApi.uploadSkin(skinData)
    await $auth.fetchUser()
    $unicore.successNotification($t('cabinet.skin_updated'))
  } catch (e) {
    if (e.response?.status == 415) $unicore.errorNotification($t('cabinet.skin_invalid'))
  }

  skin.value.value = null
  skinLoading.value = false
}

async function updateCloak() {
  cloakLoading.value = true
  const cloakData = new FormData()
  cloakData.append('file', cloak.value.files[0])

  try {
    await skinApi.uploadCloak(cloakData)
    await $auth.fetchUser()
    $unicore.successNotification($t('cabinet.cloak_updated'))
  } catch (e) {
    if (e.response?.status == 415) $unicore.errorNotification($t('cabinet.cloak_invalid'))
  }

  cloak.value.value = null
  cloakLoading.value = false
}

async function deleteSkin() {
  skinLoading.value = true
  try {
    await skinApi.removeSkin()
    await $auth.fetchUser()
    $unicore.successNotification($t('cabinet.skin_deleted'))
  } catch {}
  skinLoading.value = false
}

async function deleteCloak() {
  cloakLoading.value = true
  try {
    await skinApi.removeCloak()
    await $auth.fetchUser()
    $unicore.successNotification($t('cabinet.cloak_deleted'))
  } catch {}
  cloakLoading.value = false
}

async function unabn() {
  banLoading.value = true
  try {
    await cabinet.unban()
    await $auth.fetchUser()
    $unicore.successNotification($t('cabinet.unbanned'))
  } catch {
    $unicore.errorNotification($t('cabinet.unban_not_enough'))
  }
  banLoading.value = false
}
</script>
