<template>
  <div class="px-4">
    <div v-if="items.length" class="ff-my">
      <article v-for="item in items" :key="item.id" class="ff-my__item">
        <header class="ff-my__head">
          <div class="ff-my__title">
            <h3>{{ item.form?.title }}</h3>
            <time>{{ $moment(item.created_at).format('DD.MM.YYYY HH:mm') }}</time>
          </div>
          <Tag :severity="statusOf(item.status).severity" :value="$t(statusOf(item.status).label)" />
        </header>

        <div v-if="item.comment" class="ff-my__comment">
          <i class="bx bx-message-rounded-dots"></i>
          <p>{{ item.comment }}</p>
        </div>

        <dl class="ff-my__answers">
          <template v-for="answer in item.answers" :key="answer.key">
            <dt>{{ answer.label }}</dt>
            <dd>{{ readable(answer.value) }}</dd>
          </template>
        </dl>
      </article>
    </div>

    <div v-else class="ff-my__empty">
      <i class="bx bx-file-blank"></i>
      <span>{{ $t('mod.forms.my_empty') }}</span>
      <NuxtLink to="/mod/forms">{{ $t('mod.forms.my_empty_link') }}</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { submissionStatus } from '../../../../shared/constants'

definePageMeta({ layout: 'cabinet', middleware: ['auth', 'verify'], title: 'mod.forms.my_title' })

const { $api, $t, $moment } = useNuxtApp() as any

const { data } = await useAsyncData<any[]>('mod-forms-my', () => $api.get('/mod/forms/my').then((res: any) => res.data))

const items = computed(() => data.value || [])

const statusOf = (status: string) => submissionStatus(status)

function readable(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? $t('mod.forms.yes') : $t('mod.forms.no')

  return String(value ?? '')
}

useHead({ title: computed(() => $t('mod.forms.my_title')) })
</script>

<style scoped>
.ff-my {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ff-my__item {
  padding: 16px 18px;
  border-radius: 14px;
  background: rgba(var(--vs-text), 0.04);
}
.ff-my__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.ff-my__title h3 {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
}
.ff-my__title time {
  color: rgba(var(--vs-text), 0.5);
  font-size: 12px;
}
.ff-my__comment {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(var(--vs-primary), 0.12);
}
.ff-my__comment p {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
}
.ff-my__answers {
  display: grid;
  grid-template-columns: minmax(120px, 30%) 1fr;
  gap: 4px 16px;
  margin: 14px 0 0;
  font-size: 13px;
}
.ff-my__answers dt {
  color: rgba(var(--vs-text), 0.55);
}
.ff-my__answers dd {
  margin: 0;
  overflow-wrap: anywhere;
}
.ff-my__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 0;
  color: rgba(var(--vs-text), 0.6);
}
.ff-my__empty i {
  font-size: 30px;
}
.ff-my__empty a {
  color: rgb(var(--vs-primary));
}
</style>
