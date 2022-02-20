<template>
  <section>
    <div class="row px-4">
      <div class="col-xl-6 pe-xl-2">
        <SkinView3D class="rounded" :width="215" :height="280" :skin="$auth.user.skin" ref="Skin3D" />
        <i @click="$refs.Skin3D.setAnimation(null)" class="bx bx-male"></i>
        <i @click="$refs.Skin3D.setAnimation('walk')" class="bx bx-walk"></i>
        <i @click="$refs.Skin3D.setAnimation('run')" class="bx bx-run"></i>
      </div>
      <div class="col-xl-6 ps-xl-2">dfg</div>
    </div>
    <hr class="my-3" />
    <div class="row px-4">
      <div class="col-xl-8">
        <h2 class="m-0">Блокировки аккаунта</h2>
        <p>Информация об активных блокировках аккаунта, при блокировке вам недоступны некоторые разделы сайта и доступ к серверам.</p>
        <p class="text-success">Все круто, твой аккаунт не в бане!</p>
      </div>
      <div class="col-xl-4 d-flex align-items-center">
        <vs-button block size="large">Приобрести платный разбан</vs-button>
      </div>
    </div>
    <hr class="my-3" />
    <div class="px-4">
      <h2 class="m-0">Баланс валюты на серверах</h2>
      <p>
        Инфурмация о балансе внутриигровой валюты на серверах. Перенос, перевод и пополненение осуществляется во вкладке “ПОПОЛНЕНИЕ И
        ПЕРЕВОД”
      </p>
      <div class="row">
        <div class="col-xl-4"></div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  layout: 'cabinet',
  middleware: ['auth', 'verify'],

  asyncData({ store }) {
    store.commit('unicore/SET_NAME', 'Личный кабинет')
  },

  mounted() {
    this.$refs.Skin3D.viewer.playerObject.rotation.set(0, 0.3, 0)
  }
}
</script>