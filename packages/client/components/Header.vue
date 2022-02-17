<template>
  <div class="header">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 250" class="header-waves">
      <path
        fill="currnetColor"
        fill-opacity="1"
        d="M0,64L48,96C96,128,192,192,288,218.7C384,245,480,235,576,218.7C672,203,768,181,864,160C960,139,1056,117,1152,122.7C1248,128,1344,160,1392,176L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
      ></path>
    </svg>
    <div class="container">
      <div class="h-100 d-flex flex-column justify-content-center">
        <h1 class="mb-4"><b>UnicoreCMS</b> - Ваш сайт готов к работе</h1>
        <p class="mt-0 mb-2">
          Next-gen Headless система управления контентом и электронная коммерция для Minecraft <br />
          написанная на NestJS и NuxtJS
        </p>
        <div class="d-flex mt-4">
          <vs-button size="xl">Регистрация</vs-button>
          <vs-button size="xl" color="#7945D6">Войти</vs-button>
        </div>
      </div>
      <img class="header-render d-none d-lg-block" src="/images/render.png" />
    </div>
  </div>
</template>
