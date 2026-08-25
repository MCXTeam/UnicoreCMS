<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template v-slot:start>
            <div class="my-2">
              <Button v-if="canCreate" :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
                v-if="canDeleteMany"
                :label="$t('admin.delete')"
                icon="pi pi-trash"
                class="p-button-danger"
                :disabled="!selected || !selected.length"
                @click="removeMany()"
              />
            </div>
          </template>
        </Toolbar>

        <DataTable
          :value="permissions"
          :loading="loading"
          :rows="20"
          paginator
          v-model:filters="filters"
          rowHover
          responsiveLayout="scroll"
          v-model:selection="selected"
          @row-reorder="onPermsReorder"
          dataKey="id"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.donate_permissions_title') }}</h5>
            </div>
          </template>
          <Column :style="{ width: '3rem' }" :rowReorder="true" headerStyle="width: 3rem" />
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :style="{ width: '8rem' }"></Column>
          <Column field="name" :header="$t('admin.name')"></Column>
          <Column field="price" :header="$t('admin.price')">
            <template #body="slotProps">
              {{ $utils.formatCurrency('real', slotProps.data.price) }}
            </template>
          </Column>
          <Column field="sale" :header="$t('admin.sale')"></Column>
          <Column field="type" :header="$t('admin.type')">
            <template #body="slotProps">
              {{ types.find((type) => type.value == slotProps.data.type).name }}
            </template>
          </Column>
          <Column field="servers" :header="$t('admin.servers')" filterField="servers" :showFilterMatchModes="false">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-for="server in slotProps.data.servers" :key="server.id" :value="server.name"></Tag>
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="canUpdate"
                @click="openDialog(slotProps.data)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success mr-2"
              />
              <Button
                v-if="canDelete"
                @click="removePermission(slotProps.data.id)"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <VeeForm v-slot="{ meta }">
          <SectionedDialog
            v-model:visible="permissionDialog"
            v-model="section"
            :sections="sections"
            :header="$t('admin.permission_dialog')"
            width="620px"
            class="p-fluid"
          >
            <template #before>
              <LocaleEditorBar
                v-model="translations.locale"
                :locales="translations.locales"
                :status="translations.status"
                :isDefault="translations.isDefault"
                @copy="translations.copyFromDefault()"
              />
            </template>

            <template #main>
              <VeeField
                v-model="permission.name"
                name="name"
                :label="$t('admin.name')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.name') }}</label>
                  <InputText
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @blur="handleBlur"
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-model="permission.type"
                name="type"
                :label="$t('admin.type')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.type') }}</label>
                  <Select
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @blur="handleBlur"
                    :options="types"
                    optionLabel="name"
                    appendTo="body"
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field">
                <label>{{ $t('admin.available_periods') }}</label>
                <MultiSelect
                  v-model="permission.periods"
                  display="chip"
                  :filter="true"
                  :options="periods"
                  optionLabel="name"
                  :placeholder="$t('admin.choose_periods')"
                  class="p-column-filter"
                  appendTo="body"
                ></MultiSelect>
              </div>
              <div class="field" v-if="$_.get(permission.type, 'value') == 'game' || $_.get(permission.type, 'value') == 'kit'">
                <label>{{ $t('admin.servers') }}</label>
                <MultiSelect
                  v-model="permission.servers"
                  display="chip"
                  :filter="true"
                  :options="servers"
                  optionLabel="name"
                  :placeholder="$t('admin.choose_servers')"
                  class="p-column-filter"
                  appendTo="body"
                >
                  <template #option="slotProps">
                    <div class="p-multiselect-representative-option">
                      <IconAvatar :path="slotProps.option.icon" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </MultiSelect>
              </div>
              <div class="field" v-if="$_.get(permission.type, 'value') == 'game' || $_.get(permission.type, 'value') == 'kit'">
                <label>{{ $t('admin.rights') }}</label>
                <InputChips v-model="permission.perms" :placeholder="$t('admin.choose_permissions')" />
              </div>
              <div class="field" v-if="$_.get(permission.type, 'value') == 'web'">
                <label>{{ $t('admin.web_rights') }}</label>
                <AutoComplete
                  v-model="permission.web_perms"
                  :multiple="true"
                  :suggestions="autocompleateFilterd"
                  @complete="searchAutocompleate($event)"
                  appendTo="body"
                  :completeOnFocus="true"
                  :placeholder="$t('admin.choose_permissions')"
                />
              </div>
              <div class="field" v-if="$_.get(permission.type, 'value') == 'kit'">
                <label>{{ $t('admin.linked_kits') }}</label>
                <MultiSelect
                  v-model="permission.kits"
                  display="chip"
                  :filter="true"
                  :options="kits"
                  optionLabel="name"
                  :placeholder="$t('admin.choose_kits')"
                  class="p-column-filter"
                  appendTo="body"
                ></MultiSelect>
              </div>
            </template>

            <template #content>
              <div class="field">
                <label>{{ $t('admin.description') }}</label>
                <Editor v-model="permission.description" editorStyle="height: 220px">
                  <template #toolbar>
                    <span class="ql-formats">
                      <button class="ql-bold"></button>
                      <button class="ql-italic"></button>
                      <button class="ql-underline"></button>
                      <button class="ql-link"></button>
                      <button class="ql-image"></button>
                    </span>
                  </template>
                </Editor>
              </div>
            </template>

            <template #price>
              <div class="grid">
                <div class="col-6">
                  <VeeField
                    v-model="permission.price"
                    name="price"
                    :label="$t('admin.price')"
                    rules="required|min:0.01"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.price') }}</label>
                      <InputNumber
                        :modelValue="value"
                        @update:modelValue="handleChange"
                        @input="handleChange($event.value)"
                        @blur="handleBlur"
                        mode="decimal"
                        :minFractionDigits="realDecimals"
                        :maxFractionDigits="realDecimals"
                        :class="errorMessage && 'p-invalid'"
                      />
                      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                </div>
                <div class="col-6">
                  <VeeField
                    v-model="permission.sale"
                    name="sale"
                    :label="$t('admin.sale')"
                    rules="min_value:0|max_value:99"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.sale') }}</label>
                      <InputNumber
                        suffix=" %"
                        :useGrouping="false"
                        :modelValue="value"
                        @update:modelValue="handleChange"
                        @input="handleChange($event.value)"
                        @blur="handleBlur"
                        :class="errorMessage && 'p-invalid'"
                      />
                      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                </div>
              </div>
              <div class="field">
                <VeeField
                  v-model="permission.virtual_percent"
                  name="virtual_percent"
                  :label="$t('admin.percent')"
                  rules="min_value:0|max_value:100"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <label>{{ $t('admin.virtual_percent') }}</label>
                  <InputNumber
                    suffix=" %"
                    :useGrouping="false"
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @input="handleChange($event.value)"
                    @blur="handleBlur"
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  <small>{{ $t('admin.virtual_percent_hint') }}</small>
                </VeeField>
              </div>
            </template>

            <template #translation>
              <ContentTranslationFields :translations="translations" />
            </template>

            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updatePermission() : createPermission()"
              />
            </template>
          </SectionedDialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { Permission } from 'unicore-common/enums'
import { Form, Field } from 'vee-validate'
import { filterDonateWebPerms } from 'unicore-common/validation'
import { donateWebPermSuggestions } from '~/helpers'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const translations = useContentTranslations('donate_permission')

    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_donate_permissions')) })
    const config = useRuntimeConfig()
    const access = useAccess({
      canCreate: Permission.EditorDonatePermsCreate,
      canUpdate: Permission.EditorDonatePermsUpdate,
      canDelete: Permission.EditorDonatePermsDelete,
      canDeleteMany: Permission.EditorDonatePermsDeleteMany,
    })

    return {
      ...access,
      translations,
      realDecimals: config.public.realDecimals,
    }
  },
  data() {
    return {
      permissions: null,
      loading: true,
      selected: null,
      updateMode: false,
      permission: {
        id: null,
        name: null,
        description: null,
        price: null,
        sale: null,
        type: null,
        servers: [],
        kits: [],
        periods: [],
        perms: [],
        web_perms: [],
        virtual_percent: null,
      },
      permissionDialog: false,
      section: 'main',
      autocompleate: null,
      autocompleateFilterd: null,
      servers: null,
      periods: null,
      kits: null,
      filters: null,
    }
  },
  computed: {
    sections() {
      const isDefault = this.translations.isDefault

      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle', hidden: !isDefault },
        { key: 'content', label: 'admin.section_content', icon: 'pi pi-align-left', hidden: !isDefault },
        { key: 'price', label: 'admin.section_price', icon: 'pi pi-wallet', hidden: !isDefault },
        { key: 'translation', label: 'admin.section_translation', icon: 'pi pi-language', hidden: isDefault },
      ]
    },
    types() {
      return [
        { name: this.$t('admin.perm_type_game'), value: 'game' },
        { name: this.$t('admin.perm_type_web'), value: 'web' },
        { name: this.$t('admin.menu_kits'), value: 'kit' },
      ]
    },
  },

  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.permissionDialog = false
      this.permissions = await this.$api.get('/donates/permissions').then((res) => res.data)
      this.kits = await this.$api.get('/donates/group-kits').then((res) => res.data)
      this.periods = await this.$api.get('/donates/periods').then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)
      this.autocompleate = await this.$api.get('/admin/roles/autocompleate').then((res) => filterDonateWebPerms(res.data))
      this.loading = false
    },
    async onPermsReorder(event) {
      this.loading = true
      await this.$api.post('/donates/permissions/sort', {
        items: event.value.map((p, priority) => ({
          id: p.id,
          priority,
        })),
      })
      this.load()
    },
    searchAutocompleate(event) {
      this.autocompleateFilterd = donateWebPermSuggestions(this.autocompleate, event.query)
    },
    hideDialog() {
      this.permissionDialog = false
    },
    async openDialog(permission = null) {
      this.updateMode = !!permission
      if (permission) {
        this.permission = this.$_.pick(
          await this.$api.get('/donates/permissions/' + permission.id).then((res) => res.data),
          this.$_.deepKeys(this.permission),
        )
        this.permission.type = this.types.find((type) => type.value == this.permission.type)
      } else {
        this.permission = {
          id: null,
          name: null,
          description: null,
          price: null,
          sale: null,
          type: 'game',
          servers: [],
          kits: [],
          periods: [],
          perms: [],
          web_perms: [],
          virtual_percent: null,
        }
      }
      this.translations.attach(this.permission)
      await this.translations.load(permission ? permission.id : null)
      this.permissionDialog = true
    },
    async createPermission() {
      this.loading = true
      try {
        const { data: created } = await this.$api.post('/donates/permissions', {
          ...this.permission,
          type: this.permission.type.value,
          kits: this.permission.kits.map((kit) => kit.id),
          periods: this.permission.periods.map((period) => period.id),
          servers: this.permission.servers.map((server) => server.id),
        })

        await this.translations.save(created.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.permission_created'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async updatePermission() {
      this.loading = true
      try {
        await this.$api.patch('/donates/permissions/' + this.permission.id, {
          ...this.$_.omit(this.permission, 'id'),
          type: this.permission.type.value,
          kits: this.permission.kits.map((kit) => kit.id),
          periods: this.permission.periods.map((period) => period.id),
          servers: this.permission.servers.map((server) => server.id),
        })

        await this.translations.save(this.permission.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.permission_updated'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async removeMany() {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.delete_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/permissions/bulk', {
              data: {
                items: this.selected.map((permission) => permission.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.permissions_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async removePermission(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/donates/permissions/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.permission_deleted'),
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
