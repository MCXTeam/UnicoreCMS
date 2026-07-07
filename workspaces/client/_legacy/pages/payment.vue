<template>
  <div class="vh-100 vw-100 d-flex align-items-center justify-content-center error-layout">
    <div class="panel d-flex flex-column align-items-center justify-content-center px-5">
      <div class="d-flex align-items-center">
        <img class="my-1" src="/icon.png" height="64px" />
        <h2 class="ms-3 my-0 d-none d-md-block" v-text="$config.sitename" />
      </div>
      <h1 v-if="this.$route.query.status && this.$route.query.status == 'success'">Успешная оплата</h1>
      <h1 v-else>Отказ платежа</h1>
      <p v-if="this.$route.query.status && this.$route.query.status == 'success'" class="text-center">
        Средства были успешно начисленны на ваш баланс!
      </p>
      <p v-else>
        Операция была завершена ошибкой платежа.
      </p>
      <vs-button to="/cabinet" transparent size="large" class="mt-4"><i class="bx bx-left-arrow-alt"></i> В личный кабинет</vs-button>
    </div>
    <img class="header-render d-none d-lg-block" src="/images/render.png" />
  </div>
</template>

<script>
export default {
  head() {
    if (!this.$route.query.status)
      error({ statusCode: 404 })

    return {
      title: this.$route.query.status == 'success' ? 'Успешная оплата' : 'Отказ платежа',
    }
  },
  layout: 'empty',
  props: ['error'],
}
</script>
