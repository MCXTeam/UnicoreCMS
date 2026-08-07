<template>
  <div class="px-4">
    <div class="row justify-content-between">
      <div class="col-12 col-xl-7">
        <h2 class="mt-0 mb-4">{{ $t('cabinet.tab_history') }}</h2>
      </div>
      <div class="col input-fw">
        <Select
          class="mb-4 w-100"
          :placeholder="$t('cabinet.operation_type')"
          v-model="history_type"
          :options="typeOptions"
          optionLabel="label"
          optionValue="value"
        />
      </div>
    </div>
    <div class="position-relative">
      <DataTable
        class="no-overflow-table large-table"
        :key="history_type"
        :value="history.data"
        lazy
        :paginator="history.data.length > 0"
        :rows="history.meta.itemsPerPage"
        :totalRecords="history.meta.totalItems"
        :loading="loading"
        @page="onPage($event)"
      >
        <Column style="max-width: 200px" :header="$t('common.date')">
          <template #body="{ data }"> {{ $moment(data.created).format('D MMMM YYYY, HH:mm:ss') }} </template>
        </Column>
        <Column v-if="history_type != 'payment'" header="IP">
          <template #body="{ data }"
            ><span v-if="data.ip"> {{ data.ip }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'payment'" style="max-width: 6rem" :header="$t('cabinet.payment_id')">
          <template #body="{ data }"
            ><span v-if="data.payment"> #{{ data.payment.id }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'payment'" :header="$t('cabinet.payment_method')">
          <template #body="{ data }"
            ><span v-if="data.payment"> {{ data.payment.method }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'payment'" :header="$t('cabinet.amount')">
          <template #body="{ data }"
            ><span v-if="data.payment"> {{ $utils.formatCurrency('real', data.payment.amount) }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'payment'" :header="$t('cabinet.status')">
          <template #body="{ data }"
            ><span v-if="data.payment"> {{ data.payment.status }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'product_purchase'" :header="$t('cabinet.product')">
          <template #body="{ data }"
            ><span v-if="data.product"> {{ data.product.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'product_purchase'" :header="$t('cabinet.server')">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="`/servers/${data.server.id}`">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'product_purchase'" style="max-width: 6rem" :header="$t('cabinet.quantity')">
          <template #body="{ data }"
            ><span v-if="data.amount"> {{ $t('store.pieces', { amount: data.amount }) }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'kit_purchase'" :header="$t('store.kit')">
          <template #body="{ data }"
            ><span v-if="data.kit"> {{ data.kit.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'kit_purchase'" :header="$t('cabinet.server')">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="`/servers/${data.server.id}`">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>

        <Column v-if="history_type == 'donate_group_purchase'" :header="$t('cabinet.donate_group')">
          <template #body="{ data }"
            ><span v-if="data.donate_group"> {{ data.donate_group.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'donate_group_purchase'" :header="$t('cabinet.period')">
          <template #body="{ data }"
            ><span v-if="data.period"> {{ data.period.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'donate_group_purchase'" :header="$t('cabinet.server')">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="`/servers/${data.server.id}`">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>

        <Column v-if="history_type == 'donate_permission_purchase'" :header="$t('cabinet.donate_permission')">
          <template #body="{ data }"
            ><span v-if="data.donate_permission"> {{ data.donate_permission.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'donate_permission_purchase'" :header="$t('cabinet.period')">
          <template #body="{ data }"
            ><span v-if="data.period"> {{ data.period.name }} </span></template
          >
        </Column>
        <Column v-if="history_type == 'donate_permission_purchase'" :header="$t('cabinet.server')">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="`/servers/${data.server.id}`">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>

        <Column v-if="history_type == 'money_exchange'" :header="$t('cabinet.server')">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="`/servers/${data.server.id}`">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'money_exchange'" :header="$t('cabinet.quantity')">
          <template #body="{ data }"
            ><span v-if="data.amount"> {{ $utils.formatCurrency('ingame', data.amount) }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'money_transfer'" :header="$t('players.player')">
          <template #body="{ data }">
            <NuxtLink v-if="data.target" :to="`/user/${data.target.username}`">{{ data.target.username }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'money_transfer'" :header="$t('cabinet.server')">
          <template #body="{ data }">
            <NuxtLink v-if="data.server" :to="`/servers/${data.server.id}`">{{ data.server.name }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'money_transfer'" :header="$t('cabinet.quantity')">
          <template #body="{ data }"
            ><span v-if="data.amount"> {{ $utils.formatCurrency('ingame', data.amount) }} </span></template
          >
        </Column>

        <Column v-if="history_type == 'real_transfer'" :header="$t('players.player')">
          <template #body="{ data }">
            <NuxtLink v-if="data.target" :to="`/user/${data.target.username}`">{{ data.target.username }}</NuxtLink>
          </template>
        </Column>
        <Column v-if="history_type == 'real_transfer'" :header="$t('cabinet.quantity')">
          <template #body="{ data }"
            ><span v-if="data.amount"> {{ $utils.formatCurrency('ingame', data.amount) }} </span></template
          >
        </Column>

        <template #empty>
          <span>{{ $t('cabinet.history_empty') }}</span>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script>
definePageMeta({
  layout: 'cabinet',
  middleware: ['auth', 'verify'],
  title: 'cabinet.tab_history',
})

export default {
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('header.cabinet')) })
  },

  data() {
    return {
      loading: false,
      history_type: 'payment',
      history: {
        data: [],
        meta: {
          currentPage: 1,
          totalPages: 1,
          itemsPerPage: 10,
          totalItems: 0,
        },
      },
    }
  },

  computed: {
    typeOptions() {
      return [
        { label: this.$t('cabinet.type_payment'), value: 'payment' },
        { label: this.$t('cabinet.type_product'), value: 'product_purchase' },
        { label: this.$t('cabinet.type_kit'), value: 'kit_purchase' },
        { label: this.$t('cabinet.type_donate_group'), value: 'donate_group_purchase' },
        { label: this.$t('cabinet.type_donate_permission'), value: 'donate_permission_purchase' },
        { label: this.$t('cabinet.type_money_exchange'), value: 'money_exchange' },
        { label: this.$t('cabinet.type_money_transfer'), value: 'money_transfer' },
        { label: this.$t('cabinet.type_real_transfer'), value: 'real_transfer' },
      ]
    },
  },

  mounted() {
    this.load()
  },

  methods: {
    async load() {
      this.loading = true

      this.history = await this.$api
        .get('/cabinet/history/me', {
          params: {
            page: this.history.meta.currentPage,
            'filter.type': '$eq:' + this.history_type,
          },
        })
        .then((res) => res.data)

      this.loading = false
    },

    onPage(event) {
      this.history.meta.currentPage = event.page + 1
      this.load()
    },
  },

  watch: {
    history_type: {
      handler() {
        this.history.meta.currentPage = 1
        this.load()
      },
    },
  },
}
</script>
