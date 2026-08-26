<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :modal="true"
    :closable="closable"
    :header="header"
    :style="{ width }"
    :pt="{ root: { class: 'sectioned-dialog' } }"
  >
    <slot name="before" />

    <nav v-if="visibleSections.length > 1" class="sectioned-dialog__nav">
      <button
        v-for="section in visibleSections"
        :key="section.key"
        type="button"
        class="sectioned-dialog__tab"
        :class="{ 'sectioned-dialog__tab--active': section.key === current }"
        @click="select(section.key)"
      >
        <i v-if="section.icon" :class="section.icon" />
        <span>{{ $t(section.label) }}</span>
        <i v-if="invalid.includes(section.key)" class="pi pi-circle-fill sectioned-dialog__alert" />
      </button>
    </nav>

    <div ref="content" class="sectioned-dialog__content" :style="{ minHeight: contentMinHeight }">
      <div v-for="section in visibleSections" :key="section.key" v-show="section.key === current" :data-section="section.key">
        <slot :name="section.key" />
      </div>
    </div>

    <template #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>

<script>
export default {
  props: {
    visible: { type: Boolean, default: false },
    header: { type: String, default: '' },
    sections: { type: Array, required: true },
    modelValue: { type: String, default: null },
    width: { type: String, default: '700px' },
    closable: { type: Boolean, default: false },
  },
  emits: ['update:visible', 'update:modelValue'],
  data() {
    return {
      current: null,
      invalid: [],
      observer: null,
    }
  },
  computed: {
    visibleSections() {
      return this.sections.filter((section) => section.hidden !== true)
    },
    contentMinHeight() {
      return this.visibleSections.length > 1 ? `${this.visibleSections.length * 48}px` : null
    },
  },
  watch: {
    visible(value) {
      if (!value) {
        this.disconnect()
        this.invalid = []
        return
      }

      this.select(this.visibleSections[0]?.key)
      this.$nextTick(() => this.observe())
    },
    modelValue(value) {
      if (value && value !== this.current) this.current = value
    },
    visibleSections(sections) {
      if (this.current && !sections.some((section) => section.key === this.current)) this.select(sections[0]?.key)
    },
  },
  beforeUnmount() {
    this.disconnect()
  },
  methods: {
    select(key) {
      if (!key) return

      this.current = key
      this.$emit('update:modelValue', key)
    },
    observe() {
      this.disconnect()

      if (!this.$refs.content) return

      this.observer = new MutationObserver(() => this.refreshInvalid())
      this.observer.observe(this.$refs.content, { subtree: true, childList: true, characterData: true })
      this.refreshInvalid()
    },
    disconnect() {
      this.observer?.disconnect()
      this.observer = null
    },
    refreshInvalid() {
      if (!this.$refs.content) return

      this.invalid = this.visibleSections
        .filter((section) => {
          const node = this.$refs.content.querySelector(`[data-section="${section.key}"]`)

          return node
            ? [...node.querySelectorAll('.p-error')].some((error) => !error.closest('label') && error.textContent.trim())
            : false
        })
        .map((section) => section.key)
    },
  },
}
</script>

<style lang="scss">
.sectioned-dialog {
  overflow: visible;

  .sectioned-dialog__nav {
    position: absolute;
    top: 0;
    left: 100%;
    margin-left: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 210px;
    padding: 0.5rem;
    border-radius: 14px;
    background: var(--surface-card);
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  }

  .sectioned-dialog__content {
    display: flow-root;
  }

  .sectioned-dialog__tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    border: 0;
    border-radius: 10px;
    background: transparent;
    color: var(--text-color);
    font-size: 0.95rem;
    font-family: inherit;
    line-height: 1.2;
    cursor: pointer;
    text-align: left;
    transition:
      background-color 0.15s,
      color 0.15s;

    i:first-child {
      font-size: 1.05rem;
      color: var(--text-color-secondary);
      transition: color 0.15s;
    }

    span {
      flex: 1 1 auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &:hover {
      background: var(--surface-hover);
    }

    &--active {
      background: color-mix(in srgb, var(--primary-color) 12%, transparent);
      color: var(--primary-color);
      font-weight: 600;

      i:first-child {
        color: var(--primary-color);
      }

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 1.35rem;
        border-radius: 0 3px 3px 0;
        background: var(--primary-color);
      }
    }
  }

  .sectioned-dialog__alert {
    font-size: 0.7rem;
    color: var(--p-red-500);
  }
}

@media screen and (max-width: 1400px) {
  .sectioned-dialog {
    .sectioned-dialog__nav {
      position: static;
      flex-direction: row;
      width: auto;
      margin: 0 0 1.25rem;
      padding: 0.35rem;
      overflow-x: auto;
      box-shadow: none;
      background: var(--surface-ground);
    }

    .sectioned-dialog__tab {
      width: auto;
      padding: 0.6rem 0.9rem;

      &--active::before {
        display: none;
      }
    }
  }
}
</style>
