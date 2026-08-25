<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
            </div>
          </template>
        </Toolbar>
        <DataTable
          :value="roles"
          :loading="loading"
          :rows="50"
          paginator
          v-model:filters="filters"
          rowHover
          responsiveLayout="scroll"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.roles_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column field="id" header="ID" sortable></Column>
          <Column field="name" :header="$t('admin.name')" sortable>
            <template #body="slotProps">
              <span class="mr-2">{{ slotProps.data.name }}</span>
              <Tag v-if="slotProps.data.important" :value="$t('admin.role_edit_only')"></Tag>
            </template>
          </Column>
          <Column :header="$t('admin.role_appearance')">
            <template #body="slotProps">
              <span v-if="slotProps.data.badge" :class="badgeClass(slotProps.data)" :style="badgeStyle(slotProps.data)">{{
                slotProps.data.name
              }}</span>
              <span v-else-if="slotProps.data.color" :style="nameStyle(slotProps.data)">{{ $t('admin.role_preview_username') }}</span>
              <span v-else>—</span>
            </template>
          </Column>
          <Column field="priority" :header="$t('admin.priority')"></Column>
          <Column :style="{ width: '8rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button
                @click="removeRole(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <VeeForm as="div" v-slot="{ meta }">
          <Dialog
            v-model:visible="roleDialog"
            :closable="false"
            :style="{ width: '450px' }"
            :modal="true"
            :header="$t('admin.role_dialog')"
            class="p-fluid"
          >
            <VeeField
              v-model="role.id"
              name="id"
              label="ID (a-z)"
              :rules="{
                required: true,
                regex: /^[a-z]+$/,
              }"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>ID<span class="p-error"> *</span></label>
                <InputText :disabled="updateMode" :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" autofocus />
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="role.name"
              name="name"
              :label="$t('admin.name')"
              rules="required|alpha_dash"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>{{ $t('admin.name') }}<span class="p-error"> *</span></label>
                <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" />
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <VeeField
              v-model="role.perms"
              name="perms"
              :label="$t('admin.permissions')"
              rules="required"
              v-slot="{ value, errorMessage, handleChange }"
            >
              <PermissionsPicker
                :modelValue="value"
                @update:modelValue="handleChange"
                :universe="autocompleate"
                :label="$t('admin.permissions')"
                :required="true"
                :error="errorMessage"
              />
            </VeeField>
            <VeeField
              v-model="role.priority"
              name="priority"
              :label="$t('admin.priority')"
              rules="required"
              v-slot="{ value, errorMessage, handleChange, handleBlur }"
            >
              <div class="field">
                <label>{{ $t('admin.priority') }}<span class="p-error"> *</span></label>
                <InputNumber :modelValue="value" @update:modelValue="handleChange" @input="handleChange($event.value)" @blur="handleBlur" />
                <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
              </div>
            </VeeField>
            <Divider align="left"
              ><span class="font-medium">{{ $t('admin.role_appearance') }}</span></Divider
            >
            <div class="field">
              <label>{{ $t('admin.role_preview') }}</label>
              <div class="flex align-items-center gap-2 role-preview">
                <span :style="previewNameStyle">{{ $t('admin.role_preview_username') }}</span>
                <span v-if="role.badge" :class="previewBadgeClass" :style="previewBadgeStyle">{{
                  role.name || $t('admin.role_preview_name')
                }}</span>
              </div>
            </div>
            <ColorField
              v-model="role.color"
              :label="$t('admin.role_color')"
              :hint="$t('admin.role_color_hint')"
              :placeholder="$t('admin.role_color_empty')"
            />
            <div class="field-checkbox">
              <Checkbox :binary="true" inputId="role_badge" v-model="role.badge" />
              <label for="role_badge" class="flex align-items-center gap-1">
                {{ $t('admin.role_badge') }}
                <i v-tooltip.right="$t('admin.role_badge_hint')" class="pi pi-question-circle text-color-secondary" />
              </label>
            </div>
            <template v-if="role.badge">
              <ColorField
                v-model="role.badge_color"
                :label="$t('admin.role_badge_color')"
                :placeholder="badgeColorDefault"
              />
              <ColorField
                v-model="role.badge_background"
                :label="$t('admin.role_badge_background')"
                :placeholder="badgeBackgroundDefault"
              />
              <div class="field">
                <label class="flex align-items-center gap-1">
                  {{ $t('admin.role_badge_effect') }}
                  <i v-tooltip.right="$t('admin.role_badge_effect_hint')" class="pi pi-question-circle text-color-secondary" />
                </label>
                <Select
                  v-model="role.badge_effect"
                  :options="effects"
                  optionLabel="label"
                  optionValue="value"
                  appendTo="body"
                />
              </div>
              <ColorField
                v-if="gradient"
                v-model="role.badge_background_end"
                :label="$t('admin.role_badge_background_end')"
                :hint="$t('admin.role_badge_background_end_hint')"
                :placeholder="badgeBackgroundDefault"
              />
              <div class="field">
                <label class="flex align-items-center gap-1">
                  {{ $t('admin.role_badge_image') }}
                  <i v-tooltip.right="$t('admin.role_badge_image_hint')" class="pi pi-question-circle text-color-secondary" />
                </label>
                <small v-if="!updateMode" class="text-color-secondary">{{ $t('admin.role_badge_image_later') }}</small>
                <div v-else class="flex align-items-center gap-2">
                  <Image v-if="role.badge_image" width="120" :src="`${apiUrl}/${role.badge_image}`" preview />
                  <Button :label="$t('admin.upload')" icon="pi pi-upload" @click="$refs.badgeInput.choose()" />
                  <Button
                    v-if="role.badge_image"
                    :label="$t('admin.delete')"
                    icon="pi pi-trash"
                    class="p-button-secondary"
                    @click="removeBadgeImage()"
                  />
                  <FileUpload
                    ref="badgeInput"
                    :pt="{ root: { class: 'hidden' } }"
                    mode="basic"
                    name="file"
                    accept="image/*"
                    :auto="true"
                    :customUpload="true"
                    @uploader="uploadBadgeImage($event)"
                  />
                </div>
              </div>
            </template>
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateRole() : createRole()"
              />
            </template>
          </Dialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { FilterMatchMode } from '@primevue/core/api'
import { Form, Field } from 'vee-validate'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { ROLE_BADGE_EFFECT_LABELS, ROLE_BADGE_EFFECTS, ROLE_BADGE_DEFAULT_BACKGROUND, ROLE_BADGE_DEFAULT_COLOR, RoleBadgeEffect, roleBadgeClass, roleBadgeStyle, roleNameStyle } from 'unicore-common/roles'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_roles')) })
    const config = useRuntimeConfig()
    const toast = useToast()
    const confirm = useConfirm()
    return { toast, confirm, apiUrl: config.public.apiBaseurl }
  },
  data() {
    return {
      roles: null,
      loading: true,
      autocompleate: null,
      updateMode: false,
      role: {
        id: null,
        name: null,
        priority: 0,
        perms: [],
        color: null,
        badge: false,
        badge_color: null,
        badge_background: null,
        badge_background_end: null,
        badge_image: null,
        badge_effect: RoleBadgeEffect.None,
      },
      roleDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      },
    }
  },
  computed: {
    badgeColorDefault() {
      return ROLE_BADGE_DEFAULT_COLOR
    },
    badgeBackgroundDefault() {
      return ROLE_BADGE_DEFAULT_BACKGROUND
    },
    effects() {
      return ROLE_BADGE_EFFECTS.map((value) => ({ value, label: this.$t(ROLE_BADGE_EFFECT_LABELS[value]) }))
    },
    gradient() {
      return this.role.badge_effect === RoleBadgeEffect.Gradient || this.role.badge_effect === RoleBadgeEffect.AnimatedGradient
    },
    previewNameStyle() {
      return roleNameStyle(this.role)
    },
    previewBadgeClass() {
      return roleBadgeClass(this.role)
    },
    previewBadgeStyle() {
      return roleBadgeStyle(this.role, `${this.apiUrl}/`)
    },
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.roles = await this.$api.get('/admin/roles').then((res) => res.data)

      this.autocompleate = await this.$api.get('/admin/roles/autocompleate').then((res) => res.data)

      this.roleDialog = false
      this.loading = false
    },
    hideDialog() {
      this.roleDialog = false
    },
    openDialog(role = null) {
      this.updateMode = !!role
      if (role) {
        this.role = this.$_.pick(role, this.$_.deepKeys(this.role))
      } else {
        this.role = {
          id: null,
          name: null,
          priority: 0,
          perms: [],
          color: null,
          badge: false,
          badge_color: null,
          badge_background: null,
          badge_background_end: null,
          badge_image: null,
          badge_effect: RoleBadgeEffect.None,
        }
      }
      this.roleDialog = true
    },
    payload() {
      return this.$_.omit(this.role, 'badge_image')
    },
    nameStyle(role) {
      return roleNameStyle(role)
    },
    badgeClass(role) {
      return roleBadgeClass(role)
    },
    badgeStyle(role) {
      return roleBadgeStyle(role, `${this.apiUrl}/`)
    },
    async uploadBadgeImage(event) {
      const formData = new FormData()
      formData.append('file', event.files[0])

      try {
        const { data } = await this.$api.patch(`/admin/roles/${this.role.id}/badge`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        this.role.badge_image = data.badge_image
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.icon_updated'),
          life: 3000,
        })
      } catch {
        this.toast.add({
          severity: 'error',
          detail: this.$t('admin.images_only'),
          life: 3000,
        })
      }
    },
    async removeBadgeImage() {
      try {
        await this.$api.delete(`/admin/roles/${this.role.id}/badge`)
        this.role.badge_image = null
      } catch {}
    },
    async createRole() {
      this.loading = true
      try {
        await this.$api.post('/admin/roles', this.payload())
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.role_created'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        if (err.response.status === 409) {
          this.toast.add({
            severity: 'error',
            detail: this.$t('admin.role_exists'),
            life: 3000,
          })
        } else {
          this.toast.add({
            severity: 'error',
            detail: this.$t('admin.invalid_data'),
            life: 3000,
          })
        }
      }
    },
    async updateRole() {
      this.loading = true
      try {
        await this.$api.patch('/admin/roles/' + this.role.id, this.$_.omit(this.payload(), 'id'))
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.role_updated'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async removeRole(id) {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/admin/roles/' + id)
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.role_deleted'),
              life: 3000,
            })
          } catch {}
          await this.load()
        },
      })
    },
  },
}
</script>
