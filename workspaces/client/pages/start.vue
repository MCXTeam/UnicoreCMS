<template>
  <div>
    <p class="m-0">
      Добро пожаловать на наш милый и уютный проект! Уделите нам всего лишь пару минут Вашего времени и окажитесь в игре на наших серверах
      прямо сейчас!
    </p>
    <div class="mt-5 start-blocks">
      <div class="start-block d-flex">
        <div class="start-block-index">#1</div>
        <div>
          <h1>Регистрация на сайте</h1>
          <p>
            У нас собственная система авторизации, потому для начала Вам необходимо зарегистрироваться, не забыв перед этим ознакомиться с
            нашими правилами.
          </p>
          <ClientOnly>
            <div v-if="!$auth.loggedIn" class="d-flex flex-wrap">
              <NuxtLink to="/auth/register" class="me-2 mb-2"><Button label="Зарегистрироваться" size="large" /></NuxtLink>
              <NuxtLink to="/auth" class="mb-2"><Button label="Войти" size="large" /></NuxtLink>
            </div>
            <div v-else-if="$auth.user" class="d-flex align-items-center p-2">
              <Avatar class="rounded shadow">
                <SkinView2D class="rounded" :width="32" :height="32" :skin="$auth.user.skin" />
              </Avatar>
              <div class="ms-3">
                <h2 class="m-0">Привет, {{ $auth.user.username }}</h2>
              </div>
            </div>
          </ClientOnly>
        </div>
      </div>
      <div class="start-block d-flex">
        <div class="start-block-index">#2</div>
        <div>
          <h1>Скачать наш лаунчер</h1>
          <p class="mb-0">
            Для игры Вам необходимо скачать наш лаунчер, который сам автоматически установит и настроит всё необходимое, от Вас требуется
            его только запустить!
          </p>
          <p>
            Также для работы лаунчера, необходиом скачать <a href="https://www.java.com/ru/download/manual.jsp" target="_blank">JRE</a> и
            установить её.
          </p>
          <div class="mt-4 download-content" style="max-width: 400px">
            <a :href="config.public_launcher_exe" target="download" class="d-block mb-2">
              <Button size="large" class="w-full">Скачать лаунчер <i class="bx bxl-windows ms-2"></i></Button>
            </a>
            <div class="d-flex justify-content-between">
              <span>Клиент также доступен на</span>
              <div class="d-flex">
                <a :href="config.public_launcher_jar" target="download" class="m-0"><Button text label="Linux" /></a>
                <a :href="config.public_launcher_jar" target="download" class="m-0"><Button text label="MacOS" /></a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="start-block d-flex">
        <div class="start-block-index">#3</div>
        <div>
          <h1>Приступить к игре</h1>
          <p>
            Поздравляем, Вы великолепны! Теперь осталось только выбрать сервер по Вашему вкусу и приступить к игре. При возникновении
            проблем обратитесь в группу ВКонтакте или на наш форум.
          </p>
          <NuxtLink to="/servers"><Button label="Серверы" size="large" /></NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfigStore } from '~/stores/config'
import { useUiStore } from '~/stores/ui'

definePageMeta({ layout: 'landing' })
useHead({ title: 'Начать игру' })

const { $pub } = useNuxtApp()
const config = computed(() => useConfigStore().config as Record<string, any>)

useUiStore().setName(`Начать игру на ${$pub.sitename}`)

const route = useRoute()

onMounted(() => {
  if (route.query.ref) localStorage.setItem('ref', String(route.query.ref))
})
</script>
