<template>
  <div class="cab-grid">
    <CabTile :title="$t('cabinet.card_appearance')" icon="bx bx-user-circle" :span="7" bodyClass="cab-skin">
      <template #actions>
        <NuxtLink :to="`/user/${$auth.user.username}`">
          <Button size="small" text><i class="bx bx-link-external me-1"></i> {{ $t('cabinet.public_profile') }}</Button>
        </NuxtLink>
      </template>
      <div class="cab-skin__stage">
        <SkinView3D :width="140" :height="190" :skin="$auth.user.skin" :cloak="$auth.user.cloak" ref="Skin3D" />
        <div class="cab-skin__anim">
          <i v-tooltip.top="$t('cabinet.pose_stand')" class="bx bx-male" @click="Skin3D.setAnimation(null)"></i>
          <i v-tooltip.top="$t('cabinet.pose_walk')" class="bx bx-walk" @click="Skin3D.setAnimation('walk')"></i>
          <i v-tooltip.top="$t('cabinet.pose_run')" class="bx bx-run" @click="Skin3D.setAnimation('run')"></i>
        </div>
      </div>
      <div class="cab-skin__actions">
        <div class="cab-skin__row">
          <input type="file" ref="skin" class="d-none" accept="image/png" @change="updateSkin()" />
          <Button class="w-100" :loading="skinLoading" :label="$t('cabinet.upload_skin')" @click="skin.click()" />
          <Button
            v-tooltip.top="$t('cabinet.remove_skin')"
            severity="danger"
            outlined
            :loading="skinLoading"
            :disabled="!$auth.user.skin"
            @click="deleteSkin()"
          >
            <i class="bx bx-trash"></i>
          </Button>
        </div>
        <div class="cab-skin__row">
          <input type="file" ref="cloak" class="d-none" accept="image/png" @change="updateCloak()" />
          <Button class="w-100" outlined :loading="cloakLoading" :label="$t('cabinet.upload_cloak')" @click="cloak.click()" />
          <Button
            v-tooltip.top="$t('cabinet.remove_cloak')"
            severity="danger"
            outlined
            :loading="cloakLoading"
            :disabled="!$auth.user.cloak"
            @click="deleteCloak()"
          >
            <i class="bx bx-trash"></i>
          </Button>
        </div>
      </div>
    </CabTile>

    <CabTile :title="$t('cabinet.card_balance')" icon="bx bx-wallet-alt" :span="5" accent bodyClass="cab-metrics">
      <div class="cab-metrics__item">
        <span class="cab-metrics__label">{{ $t('cabinet.real_balance') }}</span>
        <span class="cab-metrics__value">{{ $utils.formatCurrency('real', $auth.user.real) }}</span>
      </div>
      <div class="cab-metrics__item">
        <span class="cab-metrics__label">{{ $t('cabinet.bonuses') }}</span>
        <span class="cab-metrics__value cab-metrics__value--soft">{{ $utils.formatCurrency('virtual', $auth.user.virtual) }}</span>
      </div>
      <template #footer>
        <div class="d-flex gap-2">
          <NuxtLink to="/cabinet/payment" class="w-100">
            <Button class="w-100" :label="$t('cabinet.top_up')" />
          </NuxtLink>
          <NuxtLink to="/cabinet/history" class="w-100">
            <Button class="w-100" outlined :label="$t('cabinet.tab_history')" />
          </NuxtLink>
        </div>
      </template>
    </CabTile>

    <CabTile :title="$t('profile.account_info')" icon="bx bx-id-card" :span="5" bodyClass="cab-rows">
      <div class="cab-rows__row">
        <span>{{ $t('profile.login') }}</span>
        <b><PlayerName :username="$auth.user.username" :roles="$auth.user.roles" /></b>
      </div>
      <div class="cab-rows__row">
        <span>Email</span>
        <b v-text="$auth.user.email || '—'" />
      </div>
      <div class="cab-rows__row">
        <span>{{ $t('profile.registered') }}</span>
        <b v-text="$moment($auth.user.created).format('D MMMM YYYY')" />
      </div>
      <div class="cab-rows__row">
        <span>{{ $t('profile.account_age') }}</span>
        <b v-text="$utils.formatDuration($moment() - $moment($auth.user.created), 'milliseconds')" />
      </div>
      <div v-if="inviter" class="cab-rows__row">
        <span>{{ $t('cabinet.invited_by') }}</span>
        <b v-text="inviter.inviter.username" />
      </div>
    </CabTile>

    <CabTile :title="$t('cabinet.card_privileges')" icon="bx bx-crown" :span="7">
      <template #actions>
        <NuxtLink to="/cabinet/donate">
          <Button size="small" text><i class="bx bx-plus me-1"></i> {{ $t('cabinet.tab_donate') }}</Button>
        </NuxtLink>
      </template>
      <div v-if="groups === null" class="cab-servers">
        <Skeleton v-for="n in 2" :key="n" height="52px" borderRadius="14px" />
      </div>
      <div v-else-if="groups.length" class="cab-servers">
        <div v-for="item in groups" :key="item.id" class="cab-servers__row">
          <IconAvatar :path="item.group.icon" icon="bx bx-crown" />
          <div>
            <h4 v-text="item.group.name" />
            <span v-text="item.server.name" />
          </div>
          <div class="cab-servers__value">
            <span>{{ $t('cabinet.expires') }}</span>
            <b>{{ item.expired ? $moment(item.expired).format('D MMMM YYYY') : $t('players.never') }}</b>
          </div>
        </div>
      </div>
      <div v-else class="cab-empty">
        <i class="bx bx-crown"></i>
        <span>{{ $t('cabinet.privileges_empty') }}</span>
      </div>
    </CabTile>

    <CabTile :title="$t('cabinet.ingame_balances')" icon="bx bx-coin-stack" :span="7">
      <template #actions>
        <NuxtLink to="/cabinet/payment">
          <Button size="small" text><i class="bx bx-transfer me-1"></i> {{ $t('cabinet.tab_payment') }}</Button>
        </NuxtLink>
      </template>
      <div v-if="money === null" class="cab-servers">
        <Skeleton v-for="n in 3" :key="n" height="52px" borderRadius="14px" />
      </div>
      <div v-else-if="money.length" class="cab-servers">
        <div v-for="m in money" :key="m.server.id" class="cab-servers__row">
          <IconAvatar :path="m.server.icon" icon="bx bxs-server" />
          <div>
            <h4 v-text="m.server.name" />
            <span v-text="m.server.id" />
          </div>
          <div class="cab-servers__value">
            <b>{{ $t('cabinet.coins', { amount: $utils.formatCurrency('ingame', m.money) }) }}</b>
          </div>
        </div>
      </div>
      <div v-else class="cab-empty">
        <i class="bx bxs-server"></i>
        <span>{{ $t('cabinet.servers_empty') }}</span>
      </div>
    </CabTile>

    <CabTile :title="$t('cabinet.bans_title')" icon="bx bxs-shield-alt-2" :span="5">
      <span v-if="!$auth.user.ban" class="cab-status cab-status--ok"><i class="bx bx-check"></i> {{ $t('cabinet.ban_none') }}</span>
      <span v-else-if="$auth.user.ban.expires" class="cab-status cab-status--bad">
        <i class="bx bx-block"></i>
        {{ $t('cabinet.ban_until', { date: $moment($auth.user.ban.expires).format('DD.MM.YYYY, HH:mm') }) }}
      </span>
      <span v-else class="cab-status cab-status--bad"><i class="bx bx-block"></i> {{ $t('cabinet.ban_forever') }}</span>
      <p class="cab-sub mt-3 mb-0">{{ $t('cabinet.bans_hint') }}</p>
      <template #footer>
        <Button
          class="w-100"
          outlined
          :disabled="!$auth.user.ban"
          :loading="banLoading"
          :label="$t('cabinet.buy_unban', { price: $utils.formatCurrency('real', config.public_unban_price) })"
          @click="unabn()"
        />
      </template>
    </CabTile>
  </div>
  <ExtensionSlot name="cabinet.index" />
</template>

<script setup>
definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_general', hint: 'cabinet.general_hint' })

const { $auth, $unicore, $t } = useNuxtApp()

const cabinet = useCabinet()
const moneyApi = useMoney()
const skinApi = useSkin()
const donateApi = useDonate()

useHead({ title: computed(() => $t('header.cabinet')) })
const { config } = usePublicConfig()

const Skin3D = ref(null)
const skin = ref(null)
const cloak = ref(null)

const inviter = ref(null)
const money = ref(null)
const groups = ref(null)
const skinLoading = ref(false)
const cloakLoading = ref(false)
const banLoading = ref(false)

onMounted(async () => {
  await Skin3D.value?.ready

  Skin3D.value?.viewer?.playerObject.rotation.set(0, 0.5, 0)

  money.value = await moneyApi.balance().catch(() => [])
  groups.value = await donateApi.myGroups().catch(() => [])

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
