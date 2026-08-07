<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template #start>
            <div class="my-2">
              <Button :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
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
          :value="kits.data"
          :loading="loading"
          :rows="kits.meta.itemsPerPage"
          paginator
          v-model:filters="filters"
          :totalRecords="kits.meta.totalItems"
          :rowsPerPageOptions="[20, 50, 100, 500]"
          @page="onPage($event)"
          @sort="onSort($event)"
          @filter="onFilter"
          v-model:selection="selected"
          rowHover
          lazy
          responsiveLayout="scroll"
          dataKey="id"
          filterDisplay="menu"
        >
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.store_kits_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :style="{ width: '8rem' }" sortable></Column>
          <Column field="name" :header="$t('admin.name')" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center">
                <Avatar v-if="slotProps.data.icon" :image="`${apiUrl + '/' + slotProps.data.icon}`" shape="circle" />
                <Avatar v-else icon="pi pi-image" shape="circle" />
                <span class="ml-2">{{ slotProps.data.name }}</span>
              </div>
            </template>
          </Column>
          <Column field="price" :header="$t('admin.price')" sortable>
            <template #body="slotProps">
              {{ $utils.formatCurrency('real', slotProps.data.price) }}
            </template>
          </Column>
          <Column field="sale" :header="$t('admin.sale')" sortable></Column>
          <Column field="servers" :header="$t('admin.servers')" filterField="servers" :showFilterMatchModes="false">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-for="server in slotProps.data.servers" :key="server.id" :value="server.name"></Tag>
            </template>
            <template #filter="{ filterModel }">
              <div class="mb-3 font-bold">{{ $t('admin.servers') }}</div>
              <MultiSelect
                display="chip"
                :filter="true"
                v-model="filterModel.value"
                :options="servers"
                optionLabel="name"
                :placeholder="$t('admin.choose_servers')"
                class="p-column-filter"
              >
                <template #option="slotProps">
                  <div class="p-multiselect-representative-option">
                    <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </MultiSelect>
            </template>
          </Column>
          <Column field="categories" :header="$t('admin.categories')" filterField="categories" :showFilterMatchModes="false">
            <template #body="slotProps">
              <Tag class="mr-2 mb-2" v-for="category in slotProps.data.categories" :key="category.id" :value="category.name"></Tag>
            </template>
            <template #filter="{ filterModel }">
              <div class="mb-3 font-bold">{{ $t('admin.categories') }}</div>
              <AutoComplete
                v-model="filterModel.value"
                multiple
                :suggestions="categories"
                @complete="searchCategory($event)"
                optionLabel="name"
                :placeholder="$t('admin.choose_categories')"
                style="max-width: 200px"
              >
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button @click="openDialog(slotProps.data)" icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" />
              <Button @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button
                @click="removeKit(slotProps.data.id)"
                v-if="!slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="fileDialog" :style="{ width: '400px' }" :modal="true" :header="$t('admin.kit_icon')" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <Avatar v-if="kit.icon" :image="`${apiUrl + '/' + kit.icon}`" size="xlarge" shape="circle" />
            <Avatar v-else icon="pi pi-image" size="xlarge" shape="circle" />
            <div class="field ml-6 mb-0">
              <Button :label="$t('admin.upload')" icon="pi pi-upload" @click="$refs.fileInput.choose()" />
              <Button :label="$t('admin.delete')" icon="pi pi-trash" class="p-button-secondary mt-2" @click="removeIcon()" />
              <FileUpload
                ref="fileInput"
                :pt="{ root: { class: 'hidden' } }"
                mode="basic"
                name="file"
                accept="image/*"
                :auto="true"
                :customUpload="true"
                @uploader="uploadIcon"
              />
            </div>
          </div>
        </Dialog>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="kitDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            :header="$t('admin.kit_dialog')"
            class="p-fluid"
          >
            <LocaleEditorBar
              v-model="translations.locale"
              :locales="translations.locales"
              :status="translations.status"
              :isDefault="translations.isDefault"
              @copy="translations.copyFromDefault()"
            />
            <template v-if="translations.isDefault">
              <VeeField
                v-model="kit.name"
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
                    autofocus
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field">
                <label>{{ $t('admin.description') }}</label>
                <Editor v-model="kit.description" editorStyle="height: 160px">
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
              <div class="field">
                <label>{{ $t('admin.products') }}</label>
                <Button @click="addKitItem" icon="pi pi-plus" class="p-button-rounded p-button-text" />
                <DataTable
                  :value="kit.items"
                  editMode="row"
                  v-model:editingRows="kitItems"
                  @row-edit-save="onKitItemEditSave"
                  responsiveLayout="scroll"
                >
                  <Column field="product" :header="$t('admin.store_product')" :style="{ width: '40%' }">
                    <template #body="slotProps">
                      <div class="flex align-items-center">
                        <Avatar
                          v-if="$_.get(slotProps.data, 'product.icon')"
                          :image="`${apiUrl + '/' + $_.get(slotProps.data, 'product.icon')}`"
                          shape="circle"
                        />
                        <Avatar v-else icon="pi pi-image" shape="circle" />
                        <span class="ml-2">{{ $_.get(slotProps.data, 'product.name', $t('admin.not_selected')) }}</span>
                      </div>
                    </template>
                    <template #editor="slotProps">
                      <AutoComplete
                        v-model="slotProps.data[slotProps.field]"
                        :suggestions="products"
                        @complete="searchProduct($event)"
                        optionLabel="name"
                        appendTo="body"
                      >
                        <template #option="slotProps">
                          <div class="flex align-items-center">
                            <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                            <Avatar v-else icon="pi pi-image" shape="circle" />
                            <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                          </div>
                        </template>
                      </AutoComplete>
                    </template>
                  </Column>
                  <Column field="amount" :header="$t('admin.quantity')" :style="{ width: '50%' }">
                    <template #editor="slotProps">
                      <InputNumber v-model="slotProps.data[slotProps.field]" />
                    </template>
                  </Column>
                  <Column :rowEditor="true" :style="{ width: '10%', 'min-width': '8rem' }" :bodyStyle="{ 'text-align': 'right' }"></Column>
                  <Column v-if="!kitItems || !kitItems.length" :style="{ width: '3rem' }" :bodyStyle="{ 'text-align': 'center' }">
                    <template #body="slotProps">
                      <Button
                        @click="removeKitItem(slotProps.index)"
                        icon="pi pi-trash"
                        class="p-button-rounded p-button-text p-button-danger"
                      />
                    </template>
                  </Column>
                </DataTable>
              </div>
              <div class="field">
                <label>{{ $t('admin.servers') }}</label>
                <MultiSelect
                  display="chip"
                  :filter="true"
                  v-model="kit.servers"
                  :options="servers"
                  optionLabel="name"
                  :placeholder="$t('admin.choose_servers')"
                  class="p-column-filter"
                >
                  <template #option="slotProps">
                    <div class="p-multiselect-representative-option">
                      <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </MultiSelect>
              </div>
              <div class="field">
                <label>{{ $t('admin.categories') }}</label>
                <AutoComplete
                  v-model="kit.categories"
                  multiple
                  :suggestions="categories"
                  @complete="searchCategory($event)"
                  optionLabel="name"
                  appendTo="body"
                  :placeholder="$t('admin.choose_categories')"
                >
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <Avatar v-if="slotProps.option.icon" :image="`${apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </AutoComplete>
              </div>
              <div class="grid">
                <div class="col-6">
                  <VeeField
                    v-model="kit.price"
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
                      />
                      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                </div>
                <div class="col-6">
                  <VeeField
                    v-model="kit.sale"
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
                      />
                      <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                </div>
              </div>
              <div class="field">
                <VeeField
                  v-model="kit.virtual_percent"
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
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  <small>{{ $t('admin.virtual_percent_hint') }}</small>
                </VeeField>
              </div>
            </template>
            <ContentTranslationFields v-else :translations="translations" />
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateKit() : createKit()"
              />
            </template>
          </Dialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { sortTransform } from '~/helpers'
import { FilterMatchMode } from '@primevue/core/api'
import { Form, Field } from 'vee-validate'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const translations = useContentTranslations('kit')

    const rc = useRuntimeConfig()
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.menu_kits')) })
    return { translations, apiUrl: rc.public.apiBaseurl, realDecimals: rc.public.realDecimals }
  },
  data() {
    return {
      selected: null,
      categories: null,
      products: null,
      servers: null,
      kits: {
        data: null,
        meta: {
          id: null,
          name: null,
          description: null,
          icon: null,
        },
      },
      loading: true,
      updateMode: false,
      kit: {
        id: null,
        name: null,
        description: null,
        price: null,
        sale: null,
        servers: [],
        categories: [],
        items: [],
        icon: null,
        virtual_percent: null,
      },
      fileDialog: false,
      kitDialog: false,
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        servers: { value: null, matchMode: FilterMatchMode.IN },
        categories: { value: null, matchMode: FilterMatchMode.IN },
      },
      kitItems: null,
    }
  },
  mounted() {
    this.load()
  },
  methods: {
    async load() {
      this.loading = true
      this.kits = await this.$api
        .get('/store/kits', {
          params: {
            page: this.kits.meta.currentPage,
            limit: this.kits.meta.itemsPerPage,
            sortBy: this.kits.meta.sortBy,
            search: this.filters.global.value,
            ...this.filtersTansformer(this.filters),
          },
        })
        .then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)

      this.kitDialog = false
      this.fileDialog = false
      this.loading = false
      this.selected = null
    },
    onKitItemEditSave(event) {
      let { newData, index } = event
      this.kit.items[index] = newData
    },
    addKitItem() {
      this.kit.items.push({
        amount: null,
        product: null,
      })
    },
    removeKitItem(index) {
      this.kit.items.splice(index, 1)
      this.kitItems = []
    },
    filtersTansformer(filters) {
      const transformed = {}

      if (filters.servers.value) transformed['filter.servers'] = filters.servers.value.map((server) => server.id).join(',')

      if (filters.categories.value) transformed['filter.categories'] = filters.categories.value.map((category) => category.id).join(',')

      return transformed
    },
    onPage(event) {
      this.kits.meta.currentPage = event.page + 1
      this.kits.meta.itemsPerPage = event.rows

      this.load()
    },
    onSort(event) {
      this.kits.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

      this.load()
    },
    onFilter() {
      this.load()
    },
    async searchCategory(event) {
      this.categories = await this.$api
        .get('/store/categories', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    async searchProduct(event) {
      this.products = await this.$api
        .get('/store/products', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.patch(`/store/kits/icon/` + this.kit.id, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.icon_updated'),
          life: 3000,
        })
        await this.load()
      } catch {
        this.fileDialog = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.images_only'),
          life: 3000,
        })
      }
    },
    async removeIcon() {
      try {
        await this.$api.delete(`/store/kits/icon/` + this.kit.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.icon_deleted'),
          life: 3000,
        })
        await this.load()
      } catch {}
    },
    hideDialog() {
      this.kitDialog = false
      this.kitItems = []
    },
    async openDialog(kit = null) {
      this.updateMode = !!kit
      if (kit) {
        this.kit = this.$_.pick(await this.$api.get('/store/kits/' + kit.id).then((res) => res.data), this.$_.deepKeys(this.kit))
      } else {
        this.kit = {
          id: null,
          name: null,
          description: null,
          price: null,
          sale: null,
          item_id: null,
          servers: this.filters?.servers?.value || [],
          categories: this.filters?.categories?.value || [],
          items: [],
          virtual_percent: null,
        }
      }
      this.translations.attach(this.kit)
      await this.translations.load(kit ? kit.id : null)
      this.kitDialog = true
    },
    async openFileDialog(kit) {
      this.kit = this.$_.pick(await this.$api.get('/store/kits/' + kit.id).then((res) => res.data), this.$_.deepKeys(this.kit))
      this.fileDialog = true
    },
    async createKit() {
      this.loading = true
      try {
        const { data } = await this.$api.post('/store/kits', {
          ...this.kit,
          servers: this.kit.servers.map((server) => server.id),
          items: this.kit.items.map((item) => ({ product_id: item.product.id, amount: item.amount })),
          categories: this.kit.categories.map((category) => category.id),
        })

        await this.translations.save(data.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.kit_created'),
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
    async updateKit() {
      this.loading = true
      try {
        await this.$api.patch(
          '/store/kits/' + this.kit.id,
          this.$_.omit(
            {
              ...this.kit,
              servers: this.kit.servers.map((server) => server.id),
              items: this.kit.items.map((item) => ({ product_id: item.product.id, amount: item.amount })),
              categories: this.kit.categories.map((category) => category.id),
            },
            'id',
          ),
        )

        await this.translations.save(this.kit.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.kit_updated'),
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
    async removeKit(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/store/kits/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.kit_deleted'),
              life: 3000,
            })
          } catch {}
          await this.load()
        },
      })
    },
    async removeMany() {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.delete_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/store/kits/bulk', {
              data: {
                items: this.selected.map((category) => category.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.kits_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
  },
}
</script>
