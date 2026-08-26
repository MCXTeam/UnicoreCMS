<template>
  <div>
    <div class="ff-head">
      <h1 class="m-0">{{ title }}</h1>
      <p v-if="subtitle" class="m-0">{{ subtitle }}</p>
    </div>

    <div v-if="forms.length" class="ff-grid">
      <NuxtLink v-for="form in forms" :key="form.id" :to="`/mod/forms/${form.slug}`" class="panel ff-tile">
        <i :class="form.icon || 'bx bx-edit-alt'"></i>
        <div class="ff-tile__text">
          <h2>{{ form.title }}</h2>
          <p v-if="form.description">{{ form.description }}</p>
        </div>
        <i class="bx bx-chevron-right ff-tile__go"></i>
      </NuxtLink>
    </div>

    <div v-else class="panel ff-empty">
      <i class="bx bx-file-blank"></i>
      <span>{{ $t('mod.forms.catalog_empty') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const { $api, $t } = useNuxtApp()
const { value } = usePublicConfig()

const { data } = await useAsyncData<any[]>('mod-forms-catalog', () => $api.get('/mod/forms').then((res: any) => res.data))

const forms = computed(() => data.value || [])
const title = computed(() => String(value('public_mod_forms_index_title', '') || $t('mod.forms.title')))
const subtitle = computed(() => String(value('public_mod_forms_index_subtitle', '') || ''))

useHead({ title })
</script>

<style scoped>
.ff-head {
  margin-bottom: 24px;
  text-align: center;
}
.ff-head p {
  margin-top: 8px !important;
  color: rgba(var(--vs-text), 0.6);
}
.ff-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
.ff-tile {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  color: inherit;
  text-decoration: none;
  transition: transform 160ms, background 160ms;
}
.ff-tile:hover {
  transform: translateY(-2px);
}
.ff-tile > i {
  font-size: 26px;
  color: rgb(var(--vs-primary));
}
.ff-tile__text {
  flex: 1;
  min-width: 0;
}
.ff-tile__text h2 {
  margin: 0;
  font-size: 16px;
  line-height: 1.3;
}
.ff-tile__text p {
  margin: 4px 0 0;
  color: rgba(var(--vs-text), 0.6);
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.ff-tile__go {
  color: rgba(var(--vs-text), 0.35);
  font-size: 22px;
}
.ff-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
  color: rgba(var(--vs-text), 0.6);
}
.ff-empty i {
  font-size: 32px;
}
</style>
