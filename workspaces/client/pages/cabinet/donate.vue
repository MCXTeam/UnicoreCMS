<template>
  <section>
    <vs-dialog
      :loading="loading"
      :prevent-close="loading"
      :not-close="loading"
      class="buy-dialog"
      v-model="groupDialog"
      v-if="donate.group"
    >
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 class="mt-2 mb-0">Покупка <b v-text="donate.group.name" /> на сервере <b v-text="donate.server.name" /></h4>
          <h3 v-if="donate.group.periods.find((p) => p.id == donate.period).expire" class="m-0">
            До:
            {{
              $moment()
                .add(donate.group.periods.find((p) => p.id == donate.period).expire, 'seconds')
                .format('D MMMM YYYY')
            }}
          </h3>
        </div>
      </template>
      <div class="description-html" v-if="donate.group.description" v-html="donate.group.description" />
      <vs-select class="mw-100 mt-3" :key="donate.group.periods.length" placeholder="Выберите период" v-model="donate.period">
        <vs-option v-for="period in donate.group.periods" :key="period.id" :label="period.name" :value="period.id" v-text="period.name" />
      </vs-select>
      <vs-alert v-if="donate.group.virtual_percent != 0 && config.public_donate_groups_virtual_use" relief class="mt-3">
        <template #icon>
          <i class="bx bxs-gift"></i>
        </template>
        Вы можете оплатить <b>{{ donate.group.virtual_percent || config.public_virtual_percent }}%</b> от стоимости донат-группы бонусами
      </vs-alert>
      <div v-if="calcGroupVirtSale() > 0" class="d-flex justify-content-between align-items-center mt-2">
        <vs-checkbox v-model="donate.use_virtual"> Использовать бонусы </vs-checkbox>
        <b>-{{ $utils.formatCurrency('virtual', calcGroupVirtSale()) }}</b>
      </div>
      <template #footer>
        <div class="d-flex justify-content-center" v-if="donate.period">
          <vs-button v-if="donate.use_virtual" size="large" @click="buyGroup()" transparent>
            Купить за &nbsp;<small
              ><strike>{{ $utils.formatCurrency('real', calcGroupPrice()) }}</strike></small
            >
            &nbsp;{{ $utils.formatCurrency('real', calcGroupPrice() - calcGroupVirtSale()) }}
          </vs-button>
          <vs-button v-else size="large" @click="buyGroup()" transparent>
            Купить за {{ $utils.formatCurrency('real', calcGroupPrice()) }}
          </vs-button>
        </div>
      </template>
    </vs-dialog>

    <vs-dialog
      :loading="loading"
      :prevent-close="loading"
      :not-close="loading"
      class="buy-dialog"
      v-model="permissionDialog"
      v-if="permission.permission"
    >
      <template #header>
        <div class="d-flex flex-column align-items-center">
          <h4 v-if="permission.permission.type == 'game'" class="mt-2 mb-0">
            Покупка права на сервере <b v-text="permission.server.name" />
          </h4>
          <h4 v-if="permission.permission.type == 'kit'" class="mt-2 mb-0">
            Покупка кита на сервере <b v-text="permission.server.name" />
          </h4>
          <h4 v-if="permission.permission.type == 'web'" class="mt-2 mb-0">Покупка права на сайте</h4>
          <h4 v-if="permission.permission.periods.find((p) => p.id == permission.period).expire" class="m-0">
            До:
            {{
              $moment()
                .add(permission.permission.periods.find((p) => p.id == permission.period).expire, 'seconds')
                .format('D MMMM YYYY')
            }}
          </h4>
          <h3 class="m-0" v-text="permission.permission.name" />
        </div>
      </template>
      <div class="description-html" v-if="permission.permission.description" v-html="permission.permission.description" />
      <div v-if="permission.permission.type == 'kit'" class="text-center mb-2">
        <div v-for="kit in permission.permission.kits" :key="kit.id">
          <div v-if="kit.images.find((img) => img.server.id == permission.server.id)">
            <h4 v-if="permission.permission.kits.length > 1" class="m-0" v-text="kit.name" />
            <div class="description-html" v-if="kit.description" v-html="kit.description" />
            <img
              class="mt-2"
              width="250px"
              :src="`${$config.apiUrl}/${kit.images.find((img) => img.server.id == permission.server.id).image}`"
            />
          </div>
        </div>
      </div>
      <vs-select class="mw-100 mt-3" :key="permission.permission.periods.length" placeholder="Выберите период" v-model="permission.period">
        <vs-option
          v-for="period in permission.permission.periods"
          :key="period.id"
          :label="period.name"
          :value="period.id"
          v-text="period.name"
        />
      </vs-select>
      <vs-alert v-if="permission.permission.virtual_percent != 0 && config.public_donate_perms_virtual_use" relief class="mt-3">
        <template #icon>
          <i class="bx bxs-gift"></i>
        </template>
        Вы можете оплатить <b>{{ permission.permission.virtual_percent || config.public_virtual_percent }}%</b> от стоимости донат-права бонусами
      </vs-alert>
      <div v-if="calcPermissionVirtSale() > 0" class="d-flex justify-content-between align-items-center mt-2">
        <vs-checkbox v-model="permission.use_virtual"> Использовать бонусы </vs-checkbox>
        <b>-{{ $utils.formatCurrency('virtual', calcPermissionVirtSale()) }}</b>
      </div>
      <template #footer>
        <div class="d-flex justify-content-center" v-if="permission.period">
          <vs-button v-if="permission.use_virtual" size="large" @click="buyPermission()" transparent>
            Купить за &nbsp;<small
              ><strike>{{ $utils.formatCurrency('real', calcPermissionPrice()) }}</strike></small
            >
            &nbsp;{{ $utils.formatCurrency('real', calcPermissionPrice() - calcPermissionVirtSale()) }}
          </vs-button>
          <vs-button v-else size="large" @click="buyPermission()" transparent>
            Купить за {{ $utils.formatCurrency('real', calcPermissionPrice()) }}
          </vs-button>
        </div>
      </template>
    </vs-dialog>

    <div class="row px-3">
      <div class="col-xl-6 px-4">
        <div class="d-flex justify-content-between align-items-center">
          <h2 class="m-0">Донат-группы</h2>
          <vs-select
            :loading="!servers.length"
            :key="servers.length"
            placeholder="Выберите сервер"
            v-model="donate.server_id"
            style="max-width: 150px"
          >
            <vs-option
              v-for="(server, index) in servers"
              :key="server.id"
              :label="server.name"
              :value="String(index)"
              v-text="server.name"
            />
          </vs-select>
        </div>
        <div v-if="donateGroupsMe && donate.server">
          <h4 class="mt-4 mb-2">Активные группы на сервере {{ donate.server.name }}</h4>
          <vs-table class="no-overflow-table" :key="donate.server.id">
            <template #thead>
              <vs-tr>
                <vs-th> Донат-группа</vs-th>
                <vs-th> Истекает </vs-th>
              </vs-tr>
            </template>
            <template #tbody>
              <vs-tr :key="dgm.id" v-for="dgm in donateGroupsMe.filter((dgm) => dgm.server.id == donate.server.id)" :data="dgm">
                <vs-td>
                  {{ dgm.group.name }}
                </vs-td>
                <vs-td>
                  {{ dgm.expired ? $moment(dgm.expired).local().format('D MMMM YYYY, HH:mm') : 'Никогда' }}
                </vs-td>
              </vs-tr>
            </template>
            <template #notFound>
              <span>Нет покупок</span>
            </template>
          </vs-table>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-4">
          <h4 class="text-uppercase m-0">Покупка</h4>
          <vs-button v-if="donate.server" :to="`/donate/${donate.server.id}`" class="d-none d-xl-block m-0" size="small"
            ><i class="bx bx-link me-1"></i> Подробнее</vs-button
          >
        </div>
        <div v-if="donateGroups">
          <div
            v-for="group in donateGroups.filter(
              (donate) => !donateGroupsMe.find((dgm) => dgm.server.id == donate.server.id && dgm.group.id == group.id && !dgm.expired)
            )"
            :key="group.id"
            class="d-flex justify-content-between align-items-center cab-donate-block mt-3 pb-3"
          >
            <div class="d-flex align-items-center">
              <Avatar v-if="group.icon" size="xlarge" :image="`${$config.apiUrl}/${group.icon}`"> </Avatar>
              <Avatar v-else size="xlarge"> <i class="bx bx-crown"></i> </Avatar>
              <div class="ms-4">
                <div class="d-flex align-items-center">
                  <h2 class="text-uppercase m-0" v-text="group.name" />
                  <h5 class="sale-wrapper ms-3 my-0" v-if="group.sale">-{{ group.sale }}%</h5>
                </div>
                <span v-if="!group.sale">От {{ $utils.formatCurrency('real', group.price * group.periods[0].multiplier) }}</span>
                <div v-else class="d-flex">
                  <strike v-text="$utils.formatCurrency('real', group.price * group.periods[0].multiplier)"></strike>
                  <h4 class="ms-2 my-0">От {{ $utils.formatCurrency('real', group.price * group.periods[0].multiplier, group.sale) }}</h4>
                </div>
              </div>
            </div>
            <vs-button
              v-if="donateGroupsMe.find((dgm) => dgm.server.id == donate.server.id && dgm.group.id == group.id && dgm.expired)"
              @click="openGroupDialog(group.id)"
              ><i class="bx bx-cart me-1"></i> Продлить</vs-button
            >
            <vs-button
              v-else-if="!donateGroupsMe.find((dgm) => dgm.server.id == donate.server.id && dgm.group.id == group.id)"
              @click="openGroupDialog(group.id)"
              ><i class="bx bx-cart me-1"></i> Купить</vs-button
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
          <h2 class="m-0">Донат-права</h2>
          <vs-select
            :loading="!servers.length"
            :key="servers.length"
            placeholder="Выберите сервер"
            v-model="permission.server_id"
            style="max-width: 150px"
          >
            <vs-option
              v-for="(server, index) in servers"
              :key="server.id"
              :label="server.name"
              :value="String(index)"
              v-text="server.name"
            />
          </vs-select>
        </div>
        <div v-if="donatePermissionsMe && permission.server">
          <h4 class="mt-4 mb-2">Активные донат-права на сервере {{ permission.server.name }}</h4>
          <vs-table class="no-overflow-table" :key="permission.server.id">
            <template #thead>
              <vs-tr>
                <vs-th> Донат-право</vs-th>
                <vs-th> Истекает </vs-th>
              </vs-tr>
            </template>
            <template #tbody>
              <vs-tr
                :key="dpm.id"
                v-for="dpm in donatePermissionsMe.filter((dpm) => dpm.permission.type == 'web' || dpm.server.id == permission.server.id)"
                :data="dpm"
              >
                <vs-td>
                  {{ dpm.permission.name }}
                </vs-td>
                <vs-td>
                  {{ dpm.expired ? $moment(dpm.expired).local().format('D MMMM YYYY, HH:mm') : 'Никогда' }}
                </vs-td>
              </vs-tr>
            </template>
            <template #notFound>
              <span>Нет покупок</span>
            </template>
          </vs-table>
        </div>
        <div v-if="donatePermissions">
          <div
            v-for="perm in donatePermissions.filter(
              (perm) =>
                !donatePermissionsMe.find(
                  (dpm) =>
                    (dpm.permission.type == 'web' || dpm.server.id == permission.server.id) && dpm.permission.id == perm.id && !dpm.expired
                )
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
                <span v-if="!perm.sale">От {{ $utils.formatCurrency('real', perm.price * perm.periods[0].multiplier) }}</span>
                <div v-else class="d-flex">
                  <strike v-text="$utils.formatCurrency('real', perm.price * perm.periods[0].multiplier)"></strike>
                  <h4 class="ms-2 my-0">От {{ $utils.formatCurrency('real', perm.price * perm.periods[0].multiplier, perm.sale) }}</h4>
                </div>
              </div>
            </div>
            <vs-button
              v-if="
                donatePermissionsMe.find(
                  (dpm) =>
                    (dpm.permission.type == 'web' || dpm.server.id == permission.server.id) && dpm.permission.id == perm.id && dpm.expired
                )
              "
              @click="openPermissionDialog(perm.id)"
              ><i class="bx bx-cart me-1"></i> Продлить</vs-button
            >
            <vs-button
              v-else-if="
                !donatePermissionsMe.find(
                  (dpm) => (dpm.permission.type == 'web' || dpm.server.id == permission.server.id) && dpm.permission.id == perm.id
                )
              "
              @click="openPermissionDialog(perm.id)"
              ><i class="bx bx-cart me-1"></i> Купить</vs-button
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

<script>
import { mapGetters } from 'vuex'

export default {
  layout: 'cabinet',

  data() {
    return {
      donate: {
        server_id: '',
        period: '',
        group: null,
        use_virtual: false,
      },
      permission: {
        server_id: '',
        period: '',
        permission: null,
        use_virtual: false,
      },
      servers: [],
      donateGroups: null,
      donatePermissions: null,
      donateGroupsMe: null,
      donatePermissionsMe: null,
      groupDialog: false,
      permissionDialog: false,
      loading: false,
    }
  },

  computed: {
    ...mapGetters({
      config: 'config',
    }),
  },

  watch: {
    'donate.server_id': {
      handler: function (val) {
        this.fetchDonates(this.servers[Number(val)].id)
      },
    },
    'permission.server_id': {
      handler: function (val) {
        this.fetchPermissions(this.servers[Number(val)].id)
      },
    },
  },

  async fetch() {
    await Promise.all([this.fetchPermissionsMe(), this.fetchDonatesMe()])
    this.servers = await this.$axios.get('/servers').then((res) => res.data)

    if (this.servers.length) {
      this.donate.server_id = String(0)
      this.permission.server_id = String(0)
    }
  },

  methods: {
    calcPermissionPrice() {
      const price =
        this.permission.permission.price * this.permission.permission.periods.find((p) => p.id == this.permission.period).multiplier
      return price - (price / 100) * this.permission.permission.sale
    },
    calcGroupPrice() {
      const price = this.donate.group.price * this.donate.group.periods.find((p) => p.id == this.donate.period).multiplier
      return price - (price / 100) * this.donate.group.sale
    },
    calcPermissionVirtSale() {
      const price = this.calcPermissionPrice()
      const virt_sale =
        this.config.public_donate_perms_virtual_use && this.permission.permission.virtual_percent !== 0
          ? (price / 100) * (this.permission.permission.virtual_percent || this.config.public_virtual_percent)
          : 0

      if (virt_sale >= this.$auth.user.virtual) return this.$auth.user.virtual

      return virt_sale
    },
    calcGroupVirtSale() {
      const price = this.calcGroupPrice()
      const virt_sale =
        this.config.public_donate_groups_virtual_use && this.donate.group.virtual_percent !== 0
          ? (price / 100) * (this.donate.group.virtual_percent || this.config.public_virtual_percent)
          : 0

      if (virt_sale >= this.$auth.user.virtual) return this.$auth.user.virtual

      return virt_sale
    },
    openGroupDialog(id) {
      this.donate.group = this.donateGroups.find((dg) => dg.id == id)
      this.donate.period = this.donate.group.periods[0].id
      this.donate.use_virtual = false
      this.groupDialog = true
    },
    openPermissionDialog(id) {
      this.permission.permission = this.donatePermissions.find((dg) => dg.id == id)
      this.permission.period = this.permission.permission.periods[0].id
      this.permission.use_virtual = false
      this.permissionDialog = true
    },
    async buyGroup() {
      this.loading = true
      try {
        await this.$axios.post('/donates/groups/buy', {
          server: this.servers[Number(this.donate.server_id)].id,
          group: this.donate.group.id,
          period: this.donate.period,
          use_virtual: this.donate.use_virtual,
        })
        await Promise.all([this.$auth.fetchUser(), this.fetchDonatesMe()])
        this.groupDialog = false
        this.$unicore.successNotification('Покупка была совершенна')
      } catch (e) {
        if (e.response?.status == 400)
          this.$unicore.errorNotification(
            'На балансе недостаточно средств для совершения данной покупки, либо данную донат-группу нельзя продлить'
          )
      }
      this.loading = false
    },
    async buyPermission() {
      this.loading = true
      try {
        await this.$axios.post('/donates/permissions/buy', {
          server: this.servers[Number(this.permission.server_id)].id,
          permission: this.permission.permission.id,
          period: this.permission.period,
          use_virtual: this.permission.use_virtual,
        })
        await Promise.all([this.$auth.fetchUser(), this.fetchPermissionsMe()])
        this.permissionDialog = false
        this.$unicore.successNotification('Покупка была совершенна')
      } catch (e) {
        if (e.response?.status == 400)
          this.$unicore.errorNotification(
            'На балансе недостаточно средств для совершения данной покупки, либо данное донат-право нельзя продлить'
          )
      }
      this.loading = false
    },
    async fetchDonatesMe() {
      this.donateGroupsMe = await this.$axios.get('/donates/groups/me').then((res) => res.data)
    },
    async fetchPermissionsMe() {
      this.donatePermissionsMe = await this.$axios.get('/donates/permissions/me').then((res) => res.data)
    },
    async fetchDonates(id) {
      this.donateGroups = null
      this.donateGroups = await this.$axios.get('/donates/groups/server/' + id).then((res) => res.data)
      this.donate.server = this.servers.find((srv) => srv.id == id)
    },
    async fetchPermissions(id) {
      this.donatePermissions = null
      this.donatePermissions = await this.$axios.get('/donates/permissions/server/' + id).then((res) => res.data)
      this.permission.server = this.servers[Number(this.permission.server_id)]
    },
  },

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },
}
</script>
