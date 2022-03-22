<template>
  <div class="vh-100 vw-100 d-flex align-items-center justify-content-center error-layout">
    <div class="panel d-flex flex-column align-items-center justify-content-center px-5">
      <div class="d-flex align-items-center">
        <img class="my-1" src="/icon.png" height="64px" />
        <h2 class="ms-3 my-0 d-none d-md-block" v-text="$config.name" />
      </div>
      <h1 v-if="error.statusCode == 404">Страница не найдена</h1>
      <span>Произошла ошибка - {{ error.statusCode }}</span>
      <p class="text-center" v-if="error.statusCode == 429">Слишком много запросов с данного IP, подождите пару минут...</p>
      <vs-button to="/" transparent size="large" class="mt-4"><i class="bx bx-left-arrow-alt"></i> На главную</vs-button>
    </div>
    <img class="header-render d-none d-lg-block" src="/images/render.png" />
  </div>
</template>

<script>
export default {
  layout: 'empty',
  props: ['error'],
}
</script>
