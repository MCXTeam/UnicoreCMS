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
          <Button
            :outlined="!(kit_active.donate_id == donate.id && kit_active.payload && kit_active.payload.id == kit.id)"
            @mouseover="viewKit(donate.id, kit.id)"
            @mouseleave="viewKitDestroy()"
            size="large"
            v-for="kit in donate.kits"
            :key="kit.id"
            class="me-2"
          >
            Кит "{{ kit.name }}"
          </Button>
        </div>
        <div v-if="kit_active.payload && kit_active.donate_id == donate.id" class="row mt-3">
          <div class="col-12">
            <p v-if="kit_active.payload.description" class="description-html" v-text="kit_active.payload.description" />
          </div>
          <div v-for="(img, i) in kit_active.payload.images" :key="i" class="col-xl-4 mb-3">
            <div class="kit-image">
              <h4 class="mt-0 mb-1" v-text="img.server.name" />
              <img :src="`${$pub.apiBaseurl}/${img.image}`" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $api } = useNuxtApp()
const route = useRoute()

const { data, error } = await useAsyncData<any>(`donate-${route.params.id}`, async () => {
  const server = await $api.get(`/servers/${route.params.id}`).then((res) => res.data)
  const donates = await $api.get(`/donates/groups/server/${route.params.id}`).then((res) => res.data)
  return { server, donates }
})

if (error.value || !data.value) throw createError({ statusCode: 404, fatal: true })

const server = computed<any>(() => data.value.server)
const donates = computed<any[]>(() => data.value.donates)

useUiStore().setName(`Платные услуги ${server.value.name}`)
useHead({ title: `Донат ${server.value.name}` })

const kit_active = ref<{ payload: any; donate_id: any }>({ payload: null, donate_id: null })

function viewKit(donate_id: any, kit_id: any) {
  const kit = donates.value.find((d: any) => d.id == donate_id).kits.find((k: any) => k.id == kit_id)
  kit_active.value = { payload: kit, donate_id }
}

function viewKitDestroy() {
  kit_active.value = { payload: null, donate_id: null }
}
</script>
