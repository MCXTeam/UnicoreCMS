<template>
  <section>
    <Dialog class="buy-dialog" v-model:visible="groupDialog" modal :closable="!loading" :closeOnEscape="!loading" v-if="donate.group">
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 class="mt-2 mb-0">
            {{
              donate.gift_only
                ? $t('cabinet.gift_group_title', { group: donate.group.name, server: donate.server.name })
                : $t('cabinet.buy_group_title', { group: donate.group.name, server: donate.server.name })
            }}
          </h4>
          <h3 v-if="donate.group.periods.find((p) => p.id == donate.period).expire" class="m-0">
            {{ $t('cabinet.until') }}
            {{
              $moment()
                .add(donate.group.periods.find((p) => p.id == donate.period).expire, 'seconds')
                .format('D MMMM YYYY')
            }}
          </h3>
        </div>
      </template>
      <div class="description-html" v-if="donate.group.description" v-html="$sanitize(donate.group.description)" />
      <Select
        class="mw-100 mt-3"
        :options="donate.group.periods"
        optionLabel="name"
        optionValue="id"
        :placeholder="$t('cabinet.choose_period')"
        v-model="donate.period"
      />
      <Message
        v-if="donate.group.virtual_percent != 0 && config.public_donate_groups_virtual_use"
        severity="info"
        :closable="false"
        class="mt-3"
      >
        <i class="bx bxs-gift"></i>
        {{ $t('store.virtual_hint', { percent: donate.group.virtual_percent || config.public_virtual_percent }) }}
      </Message>
      <div v-if="calcGroupVirtSale() > 0" class="d-flex justify-content-between align-items-center mt-2">
        <div class="d-flex align-items-center gap-2">
          <Checkbox v-model="donate.use_virtual" :binary="true" inputId="groupUseVirtual" />
          <label for="groupUseVirtual">{{ $t('store.use_bonuses') }}</label>
        </div>
        <b>-{{ $utils.formatCurrency('virtual', calcGroupVirtSale()) }}</b>
      </div>
      <GiftPurchase
        v-if="donate.period"
        :payload="giftGroupPayload"
        :price="giftGroupPrice"
        :allowed="donate.group.giftable !== false"
        @done="afterGift()"
      />
      <template #footer>
        <div class="d-flex justify-content-center" v-if="donate.period && !donate.gift_only">
          <Button v-if="donate.use_virtual" size="large" @click="buyGroup()">
            {{ $t('cabinet.buy_for') }} &nbsp;<small
              ><strike>{{ $utils.formatCurrency('real', calcGroupPrice()) }}</strike></small
            >
            &nbsp;{{ $utils.formatCurrency('real', calcGroupPrice() - calcGroupVirtSale()) }}
          </Button>
          <Button v-else size="large" @click="buyGroup()">
            {{ $t('cabinet.buy_for') }} {{ $utils.formatCurrency('real', calcGroupPrice()) }}
          </Button>
        </div>
      </template>
    </Dialog>

    <Dialog
      class="buy-dialog"
      v-model:visible="permissionDialog"
      modal
      :closable="!loading"
      :closeOnEscape="!loading"
      v-if="permission.permission"
    >
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 v-if="permission.gift_only" class="mt-2 mb-0">{{ $t('cabinet.gift_title') }}</h4>
          <h4 v-else-if="permission.permission.type == 'game'" class="mt-2 mb-0">
            {{ $t('cabinet.buy_permission_game', { server: permission.server.name }) }}
          </h4>
          <h4 v-else-if="permission.permission.type == 'kit'" class="mt-2 mb-0">
            {{ $t('cabinet.buy_permission_kit', { server: permission.server.name }) }}
          </h4>
          <h4 v-else class="mt-2 mb-0">{{ $t('cabinet.buy_permission_web') }}</h4>
          <h4 v-if="permission.permission.periods.find((p) => p.id == permission.period).expire" class="m-0">
            {{ $t('cabinet.until') }}
            {{
              $moment()
                .add(permission.permission.periods.find((p) => p.id == permission.period).expire, 'seconds')
                .format('D MMMM YYYY')
            }}
          </h4>
          <h3 class="m-0" v-text="permission.permission.name" />
        </div>
      </template>
      <div class="description-html" v-if="permission.permission.description" v-html="$sanitize(permission.permission.description)" />
      <div v-if="permission.permission.type == 'kit'" class="text-center mb-2">
        <div v-for="kit in permission.permission.kits" :key="kit.id">
          <div v-if="kit.images.find((img) => img.server.id == permission.server.id)">
            <h4 v-if="permission.permission.kits.length > 1" class="m-0" v-text="kit.name" />
            <div class="description-html" v-if="kit.description" v-html="$sanitize(kit.description)" />
            <img
              class="mt-2"
              width="250px"
              :src="`${$pub.apiBaseurl}/${kit.images.find((img) => img.server.id == permission.server.id).image}`"
            />
          </div>
        </div>
      </div>
      <Select
        class="mw-100 mt-3"
        :options="permission.permission.periods"
        optionLabel="name"
        optionValue="id"
        :placeholder="$t('cabinet.choose_period')"
        v-model="permission.period"
      />
      <Message
        v-if="permission.permission.virtual_percent != 0 && config.public_donate_perms_virtual_use"
        severity="info"
        :closable="false"
        class="mt-3"
      >
        <i class="bx bxs-gift"></i>
        {{ $t('store.virtual_hint', { percent: permission.permission.virtual_percent || config.public_virtual_percent }) }}
      </Message>
      <div v-if="calcPermissionVirtSale() > 0" class="d-flex justify-content-between align-items-center mt-2">
        <div class="d-flex align-items-center gap-2">
          <Checkbox v-model="permission.use_virtual" :binary="true" inputId="permissionUseVirtual" />
          <label for="permissionUseVirtual">{{ $t('store.use_bonuses') }}</label>
        </div>
        <b>-{{ $utils.formatCurrency('virtual', calcPermissionVirtSale()) }}</b>
      </div>
      <GiftPurchase
        v-if="permission.period"
        :payload="giftPermissionPayload"
        :price="giftPermissionPrice"
        :allowed="permission.permission.giftable !== false"
        @done="afterGift()"
      />
      <template #footer>
        <div class="d-flex justify-content-center" v-if="permission.period && !permission.gift_only">
          <Button v-if="permission.use_virtual" size="large" @click="buyPermission()">
            {{ $t('cabinet.buy_for') }} &nbsp;<small
              ><strike>{{ $utils.formatCurrency('real', calcPermissionPrice()) }}</strike></small
            >
            &nbsp;{{ $utils.formatCurrency('real', calcPermissionPrice() - calcPermissionVirtSale()) }}
          </Button>
          <Button v-else size="large" @click="buyPermission()">
            {{ $t('cabinet.buy_for') }} {{ $utils.formatCurrency('real', calcPermissionPrice()) }}
          </Button>
        </div>
      </template>
    </Dialog>

    <div class="cab-grid">
      <CabTile :title="$t('cabinet.donate_groups')" icon="bx bx-crown" :span="6">
        <template #actions>
          <Select
            class="cab-select"
            :options="serverOptions"
            optionLabel="label"
            optionValue="value"
            :loading="!servers.length"
            :placeholder="$t('store.choose_server')"
            v-model="donate.server_id"
          />
        </template>

        <template v-if="donateGroupsMe && donate.server">
          <h5 class="cab-section">{{ $t('cabinet.active_groups', { server: donate.server.name }) }}</h5>
          <div v-if="activeGroups.length" class="cab-servers mb-4">
            <div v-for="item in activeGroups" :key="item.id" class="cab-servers__row">
              <IconAvatar :path="item.group.icon" icon="bx bx-crown" />
              <div>
                <h4 v-text="item.group.name" />
                <span>{{ item.expired ? $moment(item.expired).format('D MMMM YYYY, HH:mm') : $t('players.never') }}</span>
              </div>
              <Button
                v-if="giftsAvailable && item.group.giftable !== false"
                v-tooltip.left="$t('cabinet.gift_give')"
                class="ms-auto"
                text
                size="small"
                @click="openGroupDialog(item.group.id, true)"
              >
                <i class="bx bxs-gift"></i>
              </Button>
            </div>
          </div>
          <p v-else class="cab-sub mb-4">{{ $t('cabinet.no_purchases') }}</p>
        </template>

        <div class="cab-section-head">
          <h5 class="cab-section m-0">{{ $t('cabinet.purchase') }}</h5>
          <NuxtLink v-if="donate.server" :to="`/donate/${donate.server.id}`">
            <Button size="small" text><i class="bx bx-link me-1"></i> {{ $t('common.more') }}</Button>
          </NuxtLink>
        </div>

        <div v-if="donateGroups" class="cab-offers">
          <div v-for="group in purchasableGroups" :key="group.id" class="cab-offer">
            <IconAvatar :path="group.icon" size="large" icon="bx bx-crown" />
            <div class="cab-offer__text">
              <div class="cab-offer__name">
                <h4 v-text="group.name" />
                <span v-if="group.sale" class="cab-badge">-{{ group.sale }}%</span>
              </div>
              <div class="cab-offer__price">
                <strike v-if="group.sale" v-text="$utils.formatCurrency('real', group.price * group.periods[0].multiplier)" />
                <b>
                  {{
                    $t('cabinet.from_price', {
                      price: $utils.formatCurrency('real', group.price * group.periods[0].multiplier, group.sale),
                    })
                  }}
                </b>
              </div>
            </div>
            <Button size="small" @click="openGroupDialog(group.id)">
              <i class="bx bx-cart me-1"></i> {{ isGroupRenew(group.id) ? $t('cabinet.renew') : $t('cabinet.buy') }}
            </Button>
          </div>
          <p v-if="!purchasableGroups.length" class="cab-sub m-0">{{ $t('cabinet.groups_all_bought') }}</p>
        </div>
        <div v-else class="cab-offers">
          <Skeleton v-for="n in 3" :key="n" height="72px" borderRadius="14px" />
        </div>
      </CabTile>

      <CabTile :title="$t('cabinet.donate_permissions')" icon="bx bx-key" :span="6">
        <template #actions>
          <Select
            class="cab-select"
            :options="serverOptions"
            optionLabel="label"
            optionValue="value"
            :loading="!servers.length"
            :placeholder="$t('store.choose_server')"
            v-model="permission.server_id"
          />
        </template>

        <template v-if="donatePermissionsMe && permission.server">
          <h5 class="cab-section">{{ $t('cabinet.active_permissions', { server: permission.server.name }) }}</h5>
          <div v-if="activePermissions.length" class="cab-servers mb-4">
            <div v-for="item in activePermissions" :key="item.id" class="cab-servers__row">
              <IconAvatar icon="bx bx-key" />
              <div>
                <h4 v-text="item.permission.name" />
                <span>{{ item.expired ? $moment(item.expired).format('D MMMM YYYY, HH:mm') : $t('players.never') }}</span>
              </div>
              <Button
                v-if="giftsAvailable && item.permission.giftable !== false"
                v-tooltip.left="$t('cabinet.gift_give')"
                class="ms-auto"
                text
                size="small"
                @click="openPermissionDialog(item.permission.id, true)"
              >
                <i class="bx bxs-gift"></i>
              </Button>
            </div>
          </div>
          <p v-else class="cab-sub mb-4">{{ $t('cabinet.no_purchases') }}</p>
        </template>

        <div class="cab-section-head">
          <h5 class="cab-section m-0">{{ $t('cabinet.purchase') }}</h5>
        </div>

        <div v-if="donatePermissions" class="cab-offers">
          <div v-for="perm in purchasablePermissions" :key="perm.id" class="cab-offer">
            <IconAvatar icon="bx bx-key" size="large" />
            <div class="cab-offer__text">
              <div class="cab-offer__name">
                <h4 v-text="perm.name" />
                <span v-if="perm.sale" class="cab-badge">-{{ perm.sale }}%</span>
              </div>
              <div class="cab-offer__price">
                <strike v-if="perm.sale" v-text="$utils.formatCurrency('real', perm.price * perm.periods[0].multiplier)" />
                <b>
                  {{
                    $t('cabinet.from_price', {
                      price: $utils.formatCurrency('real', perm.price * perm.periods[0].multiplier, perm.sale),
                    })
                  }}
                </b>
              </div>
            </div>
            <Button size="small" @click="openPermissionDialog(perm.id)">
              <i class="bx bx-cart me-1"></i> {{ isPermissionRenew(perm.id) ? $t('cabinet.renew') : $t('cabinet.buy') }}
            </Button>
          </div>
          <p v-if="!purchasablePermissions.length" class="cab-sub m-0">{{ $t('cabinet.permissions_all_bought') }}</p>
        </div>
        <div v-else class="cab-offers">
          <Skeleton v-for="n in 4" :key="n" height="72px" borderRadius="14px" />
        </div>
      </CabTile>
    </div>
  </section>
</template>

<script setup>

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_donate' })

const { $auth, $unicore, $t } = useNuxtApp()

const donateApi = useDonate()
const serversApi = useServers()
const giftsApi = useGifts()

useHead({ title: computed(() => $t('header.cabinet')) })
const { config } = usePublicConfig()

const donate = reactive({
  server_id: '',
  period: '',
  group: null,
  use_virtual: false,
  gift_only: false,
})
const permission = reactive({
  server_id: '',
  period: '',
  permission: null,
  use_virtual: false,
  gift_only: false,
})
const servers = ref([])
const donateGroups = ref(null)
const donatePermissions = ref(null)
const donateGroupsMe = ref(null)
const donatePermissionsMe = ref(null)
const groupDialog = ref(false)
const permissionDialog = ref(false)
const loading = ref(false)

const serverOptions = computed(() => servers.value.map((server, index) => ({ label: server.name, value: String(index) })))
const giftsAvailable = computed(() => giftsApi.codeEnabled.value || giftsApi.directEnabled.value)
const giftGroupPayload = computed(() => ({
  type: 'donate',
  server: donate.server?.id,
  donate_group: donate.group?.id,
  period: donate.period,
  use_virtual: donate.use_virtual,
}))
const giftPermissionPayload = computed(() => ({
  type: 'permission',
  server: permission.server?.id,
  donate_permission: permission.permission?.id,
  period: permission.period,
  use_virtual: permission.use_virtual,
}))
const activeGroups = computed(() =>
  (donateGroupsMe.value || []).filter((item) => item.server.id == donate.server?.id),
)
const purchasableGroups = computed(() =>
  (donateGroups.value || []).filter((group) => !activeGroups.value.find((item) => item.group.id == group.id && !item.expired)),
)
const activePermissions = computed(() =>
  (donatePermissionsMe.value || []).filter((item) => item.permission.type == 'web' || item.server.id == permission.server?.id),
)
const purchasablePermissions = computed(() =>
  (donatePermissions.value || []).filter(
    (perm) => !activePermissions.value.find((item) => item.permission.id == perm.id && !item.expired),
  ),
)

function isGroupRenew(id) {
  return !!activeGroups.value.find((item) => item.group.id == id && item.expired)
}
function isPermissionRenew(id) {
  return !!activePermissions.value.find((item) => item.permission.id == id && item.expired)
}

const giftGroupPrice = computed(() => calcGroupPrice() - (donate.use_virtual ? calcGroupVirtSale() : 0))
const giftPermissionPrice = computed(() => calcPermissionPrice() - (permission.use_virtual ? calcPermissionVirtSale() : 0))

function calcPermissionPrice() {
  const price = permission.permission.price * permission.permission.periods.find((p) => p.id == permission.period).multiplier
  return price - (price / 100) * permission.permission.sale
}
function calcGroupPrice() {
  const price = donate.group.price * donate.group.periods.find((p) => p.id == donate.period).multiplier
  return price - (price / 100) * donate.group.sale
}
function calcPermissionVirtSale() {
  const price = calcPermissionPrice()
  const virt_sale =
    config.value.public_donate_perms_virtual_use && permission.permission.virtual_percent !== 0
      ? (price / 100) * (permission.permission.virtual_percent || config.value.public_virtual_percent)
      : 0

  if (virt_sale >= $auth.user.virtual) return $auth.user.virtual

  return virt_sale
}
function calcGroupVirtSale() {
  const price = calcGroupPrice()
  const virt_sale =
    config.value.public_donate_groups_virtual_use && donate.group.virtual_percent !== 0
      ? (price / 100) * (donate.group.virtual_percent || config.value.public_virtual_percent)
      : 0

  if (virt_sale >= $auth.user.virtual) return $auth.user.virtual

  return virt_sale
}
function openGroupDialog(id, giftOnly = false) {
  donate.group = donateGroups.value.find((dg) => dg.id == id)
  donate.period = donate.group.periods[0].id
  donate.use_virtual = false
  donate.gift_only = giftOnly
  groupDialog.value = true
}
function openPermissionDialog(id, giftOnly = false) {
  permission.permission = donatePermissions.value.find((dg) => dg.id == id)
  permission.period = permission.permission.periods[0].id
  permission.use_virtual = false
  permission.gift_only = giftOnly
  permissionDialog.value = true
}
function afterGift() {
  groupDialog.value = false
  permissionDialog.value = false
}
async function buyGroup() {
  loading.value = true
  try {
    await donateApi.buyGroup({
      server: servers.value[Number(donate.server_id)].id,
      group: donate.group.id,
      period: donate.period,
      use_virtual: donate.use_virtual,
    })
    await Promise.all([$auth.fetchUser(), fetchDonatesMe()])
    groupDialog.value = false
    $unicore.successNotification($t('store.purchase_done'))
  } catch (e) {
    if (e.response?.status == 400) $unicore.errorNotification($t('cabinet.buy_group_error'))
  }
  loading.value = false
}
async function buyPermission() {
  loading.value = true
  try {
    await donateApi.buyPermission({
      server: servers.value[Number(permission.server_id)].id,
      permission: permission.permission.id,
      period: permission.period,
      use_virtual: permission.use_virtual,
    })
    await Promise.all([$auth.fetchUser(), fetchPermissionsMe()])
    permissionDialog.value = false
    $unicore.successNotification($t('store.purchase_done'))
  } catch (e) {
    if (e.response?.status == 400) $unicore.errorNotification($t('cabinet.buy_permission_error'))
  }
  loading.value = false
}
async function fetchDonatesMe() {
  donateGroupsMe.value = await donateApi.myGroups()
}
async function fetchPermissionsMe() {
  donatePermissionsMe.value = await donateApi.myPermissions()
}
async function fetchDonates(id) {
  donateGroups.value = null
  donateGroups.value = await donateApi.groupsByServer(id)
  donate.server = servers.value.find((srv) => srv.id == id)
}
async function fetchPermissions(id) {
  donatePermissions.value = null
  donatePermissions.value = await donateApi.permissionsByServer(id)
  permission.server = servers.value[Number(permission.server_id)]
}

watch(
  () => donate.server_id,
  (val) => {
    fetchDonates(servers.value[Number(val)].id)
  },
)
watch(
  () => permission.server_id,
  (val) => {
    fetchPermissions(servers.value[Number(val)].id)
  },
)

onMounted(async () => {
  await Promise.all([fetchPermissionsMe(), fetchDonatesMe()])
  servers.value = await serversApi.fetchList()

  if (servers.value.length) {
    donate.server_id = String(0)
    permission.server_id = String(0)
  }
})
</script>
