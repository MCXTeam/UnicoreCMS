<template>
  <div class="field">
    <label class="flex align-items-center gap-1">
      <span>{{ label }}<span v-if="required" class="p-error"> *</span></span>
      <i v-tooltip.right="$t('admin.permissions_hint')" class="pi pi-question-circle text-color-secondary" />
    </label>
    <span class="p-fluid">
      <AutoComplete
        :modelValue="selected"
        @update:modelValue="$emit('update:modelValue', $event)"
        :multiple="true"
        :suggestions="suggestions"
        @complete="search($event)"
        appendTo="body"
        :completeOnFocus="true"
        :placeholder="$t('admin.choose_permissions')"
      >
        <template #option="{ option }">
          <span class="permission-option">
            <span class="permission-dot" :class="dotClass(option)" />
            <span>{{ option }}</span>
          </span>
        </template>
      </AutoComplete>
    </span>
    <div class="permission-legend">
      <span class="permission-legend__item">
        <span class="permission-dot permission-dot--selected" />
        {{ $t('admin.permission_selected') }}
      </span>
      <span class="permission-legend__item">
        <span class="permission-dot permission-dot--covered" />
        {{ $t('admin.permission_covered') }}
      </span>
    </div>
    <small v-show="error" class="p-error">{{ error }}</small>
  </div>
</template>

<script>
import { coveredPermissions } from 'unicore-common/permissions'

export default {
  name: 'PermissionsPicker',
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    universe: {
      type: Array,
      default: () => [],
    },
    label: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: '',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      suggestions: [],
    }
  },
  computed: {
    selected() {
      return this.modelValue || []
    },
    options() {
      return this.universe || []
    },
    explicit() {
      return new Set(this.selected)
    },
    covered() {
      return new Set(coveredPermissions(this.selected, this.options))
    },
  },
  methods: {
    dotClass(option) {
      if (this.explicit.has(option)) return 'permission-dot--selected'
      if (this.covered.has(option)) return 'permission-dot--covered'

      return ''
    },
    search(event) {
      const query = event.query.trim().toLowerCase()

      if (!query) {
        this.suggestions = this.options

        return
      }

      this.suggestions = [query, ...this.options.filter((permission) => permission.toLowerCase().includes(query) && permission !== query)]
    },
  },
}
</script>

<style scoped>
.permission-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.permission-dot {
  display: inline-block;
  flex: none;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--p-surface-400);
}
.permission-dot--selected {
  background: var(--p-green-500);
}
.permission-dot--covered {
  background: var(--p-amber-500);
}
.permission-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
  color: var(--p-text-muted-color);
}
.permission-legend__item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
</style>
