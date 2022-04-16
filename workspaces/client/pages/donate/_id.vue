<template>
  <div>
    <p class="mt-0">
      Хотите открыть новые возможности и получить максимум удовольствия от любимой игры? Для Вас мы готовые предложить нечто особенное!
      Выберите свой сервер, кликнув ниже по нужному варианту.
    </p>
    <div v-for="donate in donates" :key="donate.id" class="donate-block my-4">
      <div class="p-4">
        <div class="row">
          <div class="col-12 col-xl-3">
            <div class="d-flex align-items-center mb-2">
              <h1 class="m-0">{{ donate.name }}</h1>
              <h5 class="sale-wrapper ms-2 my-0" v-if="donate.sale">-{{ donate.sale }}%</h5>
            </div>
            <h4 v-if="donate.sale" class="mt-0">
              {{ donate.periods[0].name }} за <strike v-text="$utils.formatCurrency('real', donate.price * donate.periods[0].multiplier)" />
              {{ $utils.formatCurrency('real', donate.price * donate.periods[0].multiplier, donate.sale) }}
            </h4>
          </div>
          <div class="col">
            <div class="row">
              <div class="col-xl-4 mb-3" v-for="(feature, i) in donate.features" :key="i">
                <h4 class="m-0" v-text="feature.title" />
                <small class="m-0" v-text="feature.description" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <hr />
      <div class="p-4">
        <h4 class="mt-0">Наведите для просмотра набора:</h4>
        <div class="d-flex flex-wrap">
          <vs-button
            :active="kit_active.donate_id == donate.id && kit_active.payload && kit_active.payload.id == kit.id"
            @mouseover="viewKit(donate.id, kit.id)"
            @mouseleave="viewKitDestroy()"
            border
            size="large"
            v-for="kit in donate.kits"
            :key="kit.id"
            class="me-2"
          >
            Кит "{{ kit.name }}"
          </vs-button>
        </div>
        <div v-if="kit_active.payload && kit_active.donate_id == donate.id" class="row mt-3">
          <div class="col-12">
            <p v-if="kit_active.payload.description" class="description-html" v-text="kit_active.payload.description" />
          </div>
          <div v-for="(img, i) in kit_active.payload.images" :key="i" class="col-xl-4 mb-3">
            <div class="kit-image">
              <h4 class="mt-0 mb-1" v-text="img.server.name" />
              <img :src="`${$config.apiUrl}/${img.image}`" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  layout: 'landing',
  data() {
    return {
      kit_active: {
        payload: null,
        donate_id: null,
      },
    }
  },
  head() {
    return {
      title: `Донат ${this?.server?.name}`,
    }
  },

  async asyncData({ $axios, error, route, store }) {
    try {
      const server = await $axios.get(`/servers/${route.params.id}`).then((res) => res.data)
      const donates = await $axios.get('/donates/groups/server/' + route.params.id).then((res) => res.data)

      store.commit('unicore/SET_NAME', `Платные услуги ${server.name}`)

      return { server, donates }
    } catch {
      error({ statusCode: 404 })
    }
  },

  methods: {
    viewKit(donate_id, kit_id) {
      const kit = this.donates.find((d) => d.id == donate_id).kits.find((k) => k.id == kit_id)

      this.kit_active = {
        payload: kit,
        donate_id: donate_id,
      }
    },
    viewKitDestroy() {
      this.kit_active = {
        payload: null,
        donate_id: null,
      }
    },
  },
}
</script>
