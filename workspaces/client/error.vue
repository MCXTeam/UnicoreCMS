<template>
  <div class="unicore-error">
    <h1>{{ error?.statusCode || 500 }}</h1>
    <p>{{ message }}</p>
    <Button label="На главную" icon="pi pi-home" @click="handleError" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ error: { statusCode?: number; message?: string } | null }>()

const message = computed(() => {
  if (props.error?.statusCode === 404) return 'Страница не найдена'
  if (props.error?.statusCode === 429) return 'Слишком много запросов, подождите пару минут'
  return props.error?.message || 'Что-то пошло не так'
})

const handleError = () => clearError({ redirect: '/' })
</script>

<style scoped>
.unicore-error {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  text-align: center;
}

.unicore-error h1 {
  font-size: 6rem;
  margin: 0;
}

.unicore-error p {
  opacity: 0.7;
}
</style>
