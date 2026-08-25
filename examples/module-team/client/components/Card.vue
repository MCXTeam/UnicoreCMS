<template>
  <div class="team-card">
    <div class="team-card__face">
      <SkinView2D :width="48" :height="48" :skin="member.skin || undefined" />
    </div>
    <div class="team-card__text">
      <h4 class="team-card__name">{{ member.username }}</h4>
      <span v-if="member.label" class="team-card__label" :style="labelStyle">{{ member.label }}</span>
      <p v-if="member.note?.text" class="team-card__note">{{ member.note.text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  member: {
    username: string
    label?: string | null
    color?: string | null
    note?: { text?: string | null } | null
    skin?: { file: string } | null
  }
}>()

const labelStyle = computed(() => (props.member.color ? { color: props.member.color } : {}))
</script>

<style scoped>
.team-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(var(--vs-text), 0.04);
  transition: background 160ms;
}
.team-card:hover {
  background: rgba(var(--vs-text), 0.07);
}
.team-card__face :deep(canvas) {
  display: block;
  border-radius: 10px;
  image-rendering: pixelated;
}
.team-card__text {
  min-width: 0;
}
.team-card__name {
  margin: 0;
  font-size: 15px;
  line-height: 1.3;
  overflow-wrap: anywhere;
}
.team-card__label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.35;
  color: rgb(var(--vs-primary));
}
.team-card__note {
  margin: 3px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: rgba(var(--vs-text), 0.6);
  overflow-wrap: anywhere;
}
</style>
