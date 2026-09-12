<template>
  <Editor
    class="rich-editor"
    :modelValue="modelValue || ''"
    :editorStyle="`height: ${height}`"
    :placeholder="placeholder"
    @update:modelValue="$emit('update:modelValue', $event)"
    @load="onLoad"
  >
    <template #toolbar>
      <span class="ql-formats">
        <select class="ql-header">
          <option value="1"></option>
          <option value="2"></option>
          <option value="3"></option>
          <option selected></option>
        </select>
        <select class="ql-size">
          <option value="small"></option>
          <option selected></option>
          <option value="large"></option>
          <option value="huge"></option>
        </select>
      </span>
      <span class="ql-formats">
        <button class="ql-bold"></button>
        <button class="ql-italic"></button>
        <button class="ql-underline"></button>
        <button class="ql-strike"></button>
      </span>
      <span class="ql-formats">
        <select class="ql-color"></select>
        <select class="ql-background"></select>
      </span>
      <span class="ql-formats">
        <button class="ql-list" value="ordered"></button>
        <button class="ql-list" value="bullet"></button>
        <button class="ql-indent" value="-1"></button>
        <button class="ql-indent" value="+1"></button>
      </span>
      <span class="ql-formats">
        <select class="ql-align"></select>
      </span>
      <span class="ql-formats">
        <button class="ql-blockquote"></button>
        <button class="ql-code-block"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-link"></button>
        <button v-if="uploader" class="ql-image"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-clean"></button>
      </span>
    </template>
  </Editor>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue?: string | null
    height?: string
    placeholder?: string
    accept?: string
    upload?: (file: File) => Promise<string>
  }>(),
  { height: '260px', accept: 'image/*' },
)

defineEmits<{ 'update:modelValue': [value: string] }>()

const nuxtApp = useNuxtApp() as any

const uploader = computed<((file: File) => Promise<string>) | null>(() => props.upload || nuxtApp.$uploadImage || null)

let quill: any = null

function pickImage() {
  const input = document.createElement('input')

  input.type = 'file'
  input.accept = props.accept

  input.onchange = async () => {
    const file = input.files?.[0]

    if (!file || !uploader.value) return

    const range = quill?.getSelection(true)

    try {
      const url = await uploader.value(file)

      if (url) quill?.insertEmbed(range?.index ?? 0, 'image', url, 'user')
    } catch {}
  }

  input.click()
}

function onLoad(event: any) {
  quill = event?.instance ?? null

  if (!uploader.value) return

  quill?.getModule('toolbar')?.addHandler('image', pickImage)
}
</script>

<style>
.rich-editor .ql-container {
  font-size: 1rem;
}
.rich-editor .ql-editor img {
  max-width: 100%;
}
.rich-editor .ql-snow .ql-picker.ql-header,
.rich-editor .ql-snow .ql-picker.ql-size {
  width: auto;
  min-width: 92px;
}
</style>
