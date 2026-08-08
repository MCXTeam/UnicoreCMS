<template>
  <section>
    <Dialog class="buy-dialog" v-model:visible="groupDialog" modal :closable="!loading" :closeOnEscape="!loading" v-if="donate.group">
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 class="mt-2 mb-0">
            {{ $t('cabinet.buy_group_title', { group: donate.group.name, server: donate.server.name }) }}
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
        <div class="flex align-items-center gap-2">
          <Checkbox v-model="donate.use_virtual" :binary="true" inputId="groupUseVirtual" />
          <label for="groupUseVirtual">{{ $t('store.use_bonuses') }}</label>
        </div>
        <b>-{{ $utils.formatCurrency('virtual', calcGroupVirtSale()) }}</b>
      </div>
      <template #footer>
        <div class="d-flex justify-content-center" v-if="donate.period">
          <Button v-if="donate.use_virtual" size="large" @click="buyGroup()" text>
            {{ $t('cabinet.buy_for') }} &nbsp;<small
              ><strike>{{ $utils.formatCurrency('real', calcGroupPrice()) }}</strike></small
            >
            &nbsp;{{ $utils.formatCurrency('real', calcGroupPrice() - calcGroupVirtSale()) }}
          </Button>
          <Button v-else size="large" @click="buyGroup()" text>
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
          <h4 v-if="permission.permission.type == 'game'" class="mt-2 mb-0">
            {{ $t('cabinet.buy_permission_game', { server: permission.server.name }) }}
          </h4>
          <h4 v-if="permission.permission.type == 'kit'" class="mt-2 mb-0">
            {{ $t('cabinet.buy_permission_kit', { server: permission.server.name }) }}
          </h4>
          <h4 v-if="permission.permission.type == 'web'" class="mt-2 mb-0">{{ $t('cabinet.buy_permission_web') }}</h4>
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
        <div class="flex align-items-center gap-2">
          <Checkbox v-model="permission.use_virtual" :binary="true" inputId="permissionUseVirtual" />
          <label for="permissionUseVirtual">{{ $t('store.use_bonuses') }}</label>
        </div>
        <b>-{{ $utils.formatCurrency('virtual', calcPermissionVirtSale()) }}</b>
      </div>
      <template #footer>
        <div class="d-flex justify-content-center" v-if="permission.period">
          <Button v-if="permission.use_virtual" size="large" @click="buyPermission()" text>
            {{ $t('cabinet.buy_for') }} &nbsp;<small
              ><strike>{{ $utils.formatCurrency('real', calcPermissionPrice()) }}</strike></small
            >
            &nbsp;{{ $utils.formatCurrency('real', calcPermissionPrice() - calcPermissionVirtSale()) }}
          </Button>
          <Button v-else size="large" @click="buyPermission()" text>
            {{ $t('cabinet.buy_for') }} {{ $utils.formatCurrency('real', calcPermissionPrice()) }}
          </Button>
        </div>
      </template>
    </Dialog>

    <div class="row px-3">
      <div class="col-xl-6 px-4">
        <div class="d-flex justify-content-between align-items-center">
          <h2 class="m-0">{{ $t('cabinet.donate_groups') }}</h2>
          <Select
            :options="serverOptions"
            optionLabel="label"
            optionValue="value"
            :loading="!servers.length"
            :placeholder="$t('store.choose_server')"
            v-model="donate.server_id"
            style="max-width: 150px"
          />
        </div>
        <div v-if="donateGroupsMe && donate.server">
          <h4 class="mt-4 mb-2">{{ $t('cabinet.active_groups', { server: donate.server.name }) }}</h4>
          <DataTable class="no-overflow-table" :value="donateGroupsMe.filter((dgm) => dgm.server.id == donate.server.id)">
            <template #empty
              ><span>{{ $t('cabinet.no_purchases') }}</span></template
            >
            <Column :header="$t('cabinet.donate_group')">
              <template #body="{ data }">{{ data.group.name }}</template>
            </Column>
            <Column :header="$t('cabinet.expires')">
              <template #body="{ data }">{{
                data.expired ? $moment(data.expired).format('D MMMM YYYY, HH:mm') : $t('players.never')
              }}</template>
            </Column>
          </DataTable>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-4">
          <h4 class="text-uppercase m-0">{{ $t('cabinet.purchase') }}</h4>
          <NuxtLink v-if="donate.server" :to="`/donate/${donate.server.id}`" class="d-none d-xl-block m-0">
            <Button size="small"><i class="bx bx-link me-1"></i> {{ $t('common.more') }}</Button>
          </NuxtLink>
        </div>
        <div v-if="donateGroups">
          <div
            v-for="group in donateGroups.filter(
              (don) => !donateGroupsMe.find((dgm) => dgm.server.id == donate.server.id && dgm.group.id == don.id && !dgm.expired),
            )"
            :key="group.id"
            class="d-flex justify-content-between align-items-center cab-donate-block mt-3 pb-3"
          >
            <div class="d-flex align-items-center">
              <IconAvatar :path="group.icon" size="xlarge" icon="bx bx-crown" />
              <div class="ms-4">
                <div class="d-flex align-items-center">
                  <h2 class="text-uppercase m-0" v-text="group.name" />
                  <h5 class="sale-wrapper ms-3 my-0" v-if="group.sale">-{{ group.sale }}%</h5>
                </div>
                <span v-if="!group.sale">
                  {{ $t('cabinet.from_price', { price: $utils.formatCurrency('real', group.price * group.periods[0].multiplier) }) }}
                </span>
                <div v-else class="d-flex">
                  <strike v-text="$utils.formatCurrency('real', group.price * group.periods[0].multiplier)"></strike>
                  <h4 class="ms-2 my-0">
                    {{
                      $t('cabinet.from_price', {
                        price: $utils.formatCurrency('real', group.price * group.periods[0].multiplier, group.sale),
                      })
                    }}
                  </h4>
                </div>
              </div>
            </div>
            <Button
              v-if="donateGroupsMe.find((dgm) => dgm.server.id == donate.server.id && dgm.group.id == group.id && dgm.expired)"
              @click="openGroupDialog(group.id)"
              ><i class="bx bx-cart me-1"></i> {{ $t('cabinet.renew') }}</Button
            >
            <Button
              v-else-if="!donateGroupsMe.find((dgm) => dgm.server.id == donate.server.id && dgm.group.id == group.id)"
              @click="openGroupDialog(group.id)"
              ><i class="bx bx-cart me-1"></i> {{ $t('cabinet.buy') }}</Button
            >
          </div>
        </div>
        <div v-else>
          <div class="col-xl-4 d-flex align-items-center w-100 cab-donate-block mt-3 pb-3" v-for="(n, index) in 3" :key="index">
            <Skeleton size="4rem"></Skeleton>
            <div class="ms-3" style="flex: 1">
              <Skeleton width="75%" class="mb-2"></Skeleton>
              <Skeleton width="50%"></Skeleton>
            </div>
            <Skeleton width="25%" height="25px"></Skeleton>
          </div>
        </div>
      </div>
      <div class="col px-4 pt-4 pt-xl-0">
        <div class="d-flex justify-content-between align-items-center">
          <h2 class="m-0">{{ $t('cabinet.donate_permissions') }}</h2>
          <Select
            :options="serverOptions"
            optionLabel="label"
            optionValue="value"
            :loading="!servers.length"
            :placeholder="$t('store.choose_server')"
            v-model="permission.server_id"
            style="max-width: 150px"
          />
        </div>
        <div v-if="donatePermissionsMe && permission.server">
          <h4 class="mt-4 mb-2">{{ $t('cabinet.active_permissions', { server: permission.server.name }) }}</h4>
          <DataTable
            class="no-overflow-table"
            :value="donatePermissionsMe.filter((dpm) => dpm.permission.type == 'web' || dpm.server.id == permission.server.id)"
          >
            <template #empty
              ><span>{{ $t('cabinet.no_purchases') }}</span></template
            >
            <Column :header="$t('cabinet.donate_permission')">
              <template #body="{ data }">{{ data.permission.name }}</template>
            </Column>
            <Column :header="$t('cabinet.expires')">
              <template #body="{ data }">{{
                data.expired ? $moment(data.expired).format('D MMMM YYYY, HH:mm') : $t('players.never')
              }}</template>
            </Column>
          </DataTable>
        </div>
        <div v-if="donatePermissions">
          <div
            v-for="perm in donatePermissions.filter(
              (perm) =>
                !donatePermissionsMe.find(
                  (dpm) =>
                    (dpm.permission.type == 'web' || dpm.server.id == permission.server.id) && dpm.permission.id == perm.id && !dpm.expired,
                ),
            )"
            :key="perm.id"
            class="d-flex justify-content-between align-items-center cab-donate-block mt-3 pb-3"
          >
            <div class="d-flex align-items-center">
              <div>
                <div class="d-flex align-items-center">
                  <h4 class="text-uppercase m-0" v-text="perm.name" />
                  <h5 class="sale-wrapper ms-3 my-0" v-if="perm.sale">-{{ perm.sale }}%</h5>
                </div>
                <span v-if="!perm.sale">
                  {{ $t('cabinet.from_price', { price: $utils.formatCurrency('real', perm.price * perm.periods[0].multiplier) }) }}
                </span>
                <div v-else class="d-flex">
                  <strike v-text="$utils.formatCurrency('real', perm.price * perm.periods[0].multiplier)"></strike>
                  <h4 class="ms-2 my-0">
                    {{
                      $t('cabinet.from_price', {
                        price: $utils.formatCurrency('real', perm.price * perm.periods[0].multiplier, perm.sale),
                      })
                    }}
                  </h4>
                </div>
              </div>
            </div>
            <Button
              v-if="
                donatePermissionsMe.find(
                  (dpm) =>
                    (dpm.permission.type == 'web' || dpm.server.id == permission.server.id) && dpm.permission.id == perm.id && dpm.expired,
                )
              "
              @click="openPermissionDialog(perm.id)"
              ><i class="bx bx-cart me-1"></i> {{ $t('cabinet.renew') }}</Button
            >
            <Button
              v-else-if="
                !donatePermissionsMe.find(
                  (dpm) => (dpm.permission.type == 'web' || dpm.server.id == permission.server.id) && dpm.permission.id == perm.id,
                )
              "
              @click="openPermissionDialog(perm.id)"
              ><i class="bx bx-cart me-1"></i> {{ $t('cabinet.buy') }}</Button
            >
          </div>
        </div>
        <div v-else>
          <div class="col-xl-4 d-flex align-items-center w-100 cab-donate-block mt-3 pb-3" v-for="(n, index) in 3" :key="index">
            <div style="flex: 1">
              <Skeleton width="75%" class="mb-2"></Skeleton>
              <Skeleton width="50%"></Skeleton>
            </div>
            <Skeleton width="25%" height="25px"></Skeleton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useConfigStore } from '~/stores/config'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'cabinet.tab_donate' })

const { $api, $auth, $unicore, $t } = useNuxtApp()

useHead({ title: computed(() => $t('header.cabinet')) })
const config = computed(() => useConfigStore().config)

const donate = reactive({
  server_id: '',
  period: '',
  group: null,
  use_virtual: false,
})
const permission = reactive({
  server_id: '',
  period: '',
  permission: null,
  use_virtual: false,
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
function openGroupDialog(id) {
  donate.group = donateGroups.value.find((dg) => dg.id == id)
  donate.period = donate.group.periods[0].id
  donate.use_virtual = false
  groupDialog.value = true
}
function openPermissionDialog(id) {
  permission.permission = donatePermissions.value.find((dg) => dg.id == id)
  permission.period = permission.permission.periods[0].id
  permission.use_virtual = false
  permissionDialog.value = true
}
async function buyGroup() {
  loading.value = true
  try {
    await $api.post('/donates/groups/buy', {
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
    await $api.post('/donates/permissions/buy', {
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
  donateGroupsMe.value = await $api.get('/donates/groups/me').then((res) => res.data)
}
async function fetchPermissionsMe() {
  donatePermissionsMe.value = await $api.get('/donates/permissions/me').then((res) => res.data)
}
async function fetchDonates(id) {
  donateGroups.value = null
  donateGroups.value = await $api.get('/donates/groups/server/' + id).then((res) => res.data)
  donate.server = servers.value.find((srv) => srv.id == id)
}
async function fetchPermissions(id) {
  donatePermissions.value = null
  donatePermissions.value = await $api.get('/donates/permissions/server/' + id).then((res) => res.data)
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
  servers.value = await $api.get('/servers').then((res) => res.data)

  if (servers.value.length) {
    donate.server_id = String(0)
    permission.server_id = String(0)
  }
})
</script>
