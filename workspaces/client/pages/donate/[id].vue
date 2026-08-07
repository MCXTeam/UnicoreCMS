<template>
  <div>
    <p class="mt-0">{{ $t('donate.intro') }}</p>
    <div v-for="donate in donates" :key="donate.id" class="donate-block my-4">
      <div class="p-4">
        <div class="row">
          <div class="col-12 col-xl-3">
            <div class="d-flex align-items-center mb-2">
              <h1 class="m-0">{{ donate.name }}</h1>
              <h5 class="sale-wrapper ms-2 my-0" v-if="donate.sale">-{{ donate.sale }}%</h5>
            </div>
            <h4 v-if="donate.periods?.length" class="mt-0">
              {{ $t('donate.period_price', { period: donate.periods[0].name }) }}
              <strike v-if="donate.sale" v-text="$utils.formatCurrency('real', donate.price * donate.periods[0].multiplier)" />
              {{ $utils.formatCurrency('real', donate.price * donate.periods[0].multiplier, donate.sale) }}
            </h4>
            <div v-if="donate.icon" class="donate-icon mb-3">
              <img :src="`${$pub.apiBaseurl}/${donate.icon}`" :alt="donate.name" />
            </div>
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
        <h4 class="mt-0">{{ $t('donate.kit_hint') }}</h4>
        <div class="d-flex flex-wrap">
          <Button
            :outlined="!isKitActive(donate.id, kit.id)"
            @mouseover="viewKit(donate.id, kit.id)"
            @mouseleave="viewKitDestroy()"
            @click="toggleKit(donate.id, kit.id)"
            size="large"
            v-for="kit in donate.kits"
            :key="kit.id"
            class="me-2"
          >
            {{ $t('donate.kit_name', { name: kit.name }) }}
            <i v-if="kit_pinned && isKitActive(donate.id, kit.id)" class="bx bx-pin ms-1"></i>
          </Button>
        </div>
        <div
          v-if="kit_active.payload && kit_active.donate_id == donate.id"
          class="row mt-3"
          @mouseover="cancelKitHide()"
          @mouseleave="viewKitDestroy()"
        >
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
import { KIT_HIDE_DELAY_MS } from '~/constants'
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })

const { $api, $t } = useNuxtApp()
const route = useRoute()

const { data, error } = await useAsyncData<any>(`donate-${route.params.id}`, async () => {
  const server = await $api.get(`/servers/${route.params.id}`).then((res) => res.data)
  const donates = await $api.get(`/donates/groups/server/${route.params.id}`).then((res) => res.data)
  return { server, donates }
})

if (error.value || !data.value) throw createError({ statusCode: 404, fatal: true })

const server = computed<any>(() => data.value.server)
const donates = computed<any[]>(() => data.value.donates)

useUiStore().setName($t('donate.page_name', { sitename: server.value.name }))
useHead({ title: computed(() => `${$t('header.donate')} ${server.value.name}`) })

const kit_active = ref<{ payload: any; donate_id: any }>({ payload: null, donate_id: null })
const kit_pinned = ref(false)
let kitHideTimer: ReturnType<typeof setTimeout> | null = null

function findKit(donate_id: any, kit_id: any) {
  return donates.value.find((d: any) => d.id == donate_id)?.kits.find((k: any) => k.id == kit_id)
}

function isKitActive(donate_id: any, kit_id: any) {
  return kit_active.value.donate_id == donate_id && kit_active.value.payload?.id == kit_id
}

function cancelKitHide() {
  if (!kitHideTimer) return
  clearTimeout(kitHideTimer)
  kitHideTimer = null
}

function viewKit(donate_id: any, kit_id: any) {
  cancelKitHide()
  if (kit_pinned.value) return
  kit_active.value = { payload: findKit(donate_id, kit_id), donate_id }
}

function viewKitDestroy() {
  cancelKitHide()
  if (kit_pinned.value) return
  kitHideTimer = setTimeout(() => {
    kit_active.value = { payload: null, donate_id: null }
    kitHideTimer = null
  }, KIT_HIDE_DELAY_MS)
}

function toggleKit(donate_id: any, kit_id: any) {
  cancelKitHide()

  if (kit_pinned.value && isKitActive(donate_id, kit_id)) {
    kit_pinned.value = false
    kit_active.value = { payload: null, donate_id: null }
    return
  }

  kit_active.value = { payload: findKit(donate_id, kit_id), donate_id }
  kit_pinned.value = true
}

onBeforeUnmount(cancelKitHide)
</script>
