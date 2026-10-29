<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <div class="products-heading">
          <h1 class="m-0">{{ $t('admin.products_title') }}</h1>
          <div class="flex flex-wrap gap-2">
            <Button v-if="canCreate" :label="$t('admin.create')" icon="pi pi-plus" @click="openDialog()" />
            <Button v-if="canImport || canExport" :label="$t('admin.import_export')" icon="pi pi-upload" outlined aria-haspopup="true" aria-controls="products-transfer-menu" @click="$refs.transferMenu.toggle($event)" />
            <Menu ref="transferMenu" id="products-transfer-menu" :model="transferActions" popup />
          </div>
        </div>
        <div class="products-filters">
          <IconField class="products-search">
            <InputIcon class="pi pi-search" />
            <InputText @keydown.enter="onFilter()" v-model="filters.global.value" :placeholder="$t('admin.search')" :aria-label="$t('admin.search')" />
          </IconField>
          <MultiSelect v-model="filters.servers.value" :options="servers" optionLabel="name" :placeholder="$t('admin.choose_servers')" :aria-label="$t('admin.servers')" :maxSelectedLabels="1" filter showClear @change="onFilter()" />
          <AutoComplete v-model="filters.categories.value" multiple :suggestions="categories" @complete="searchCategory($event)" optionLabel="name" :placeholder="$t('admin.choose_categories')" :aria-label="$t('admin.categories')" @item-select="onFilter()" @item-unselect="onFilter()" />
          <Select :modelValue="sortValue" :options="sortOptions" optionLabel="label" optionValue="value" :aria-label="$t('admin.sorting')" @update:modelValue="setSorting($event)" />
        </div>
        <div v-if="selected?.length" class="flex flex-wrap align-items-center gap-2 mb-3">
          <span>{{ $t('admin.selected_items', { count: selected.length }) }}</span>
          <Button v-if="canUpdateMany" :label="$t('admin.edit')" icon="pi pi-pencil" outlined @click="openManyDialog()" />
          <Button v-if="canDeleteMany" :label="$t('admin.delete')" icon="pi pi-trash" severity="danger" outlined @click="removeMany()" />
        </div>
        <p class="products-scroll-hint text-color-secondary">{{ $t('admin.table_scroll_hint') }}</p>
        <Menu ref="rowMenu" id="products-row-menu" :model="rowActions" popup />
        <DataTable
          class="products-table"
          :tableStyle="{ minWidth: '760px' }"
          :value="products.data"
          :loading="loading"
          :rows="products.meta.itemsPerPage"
          :first="Math.max(0, products.meta.currentPage - 1) * products.meta.itemsPerPage"
          :sortField="sortValue.split(':')[0]"
          :sortOrder="sortValue.split(':')[1] === 'DESC' ? -1 : 1"
          paginator
          v-model:filters="filters"
          :totalRecords="products.meta.totalItems"
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
          <Column v-if="canDeleteMany || canUpdateMany" selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="name" :header="$t('admin.name')" sortable>
            <template #body="slotProps">
              <div class="products-name">
                <IconAvatar :path="slotProps.data.icon" />
                <div><strong>{{ slotProps.data.name }}</strong><small class="block text-color-secondary">ID {{ slotProps.data.id }}</small></div>
              </div>
            </template>
          </Column>
          <Column field="price" :header="$t('admin.price')" sortable headerClass="products-price" bodyClass="products-price">
            <template #body="slotProps">
              {{ $utils.formatCurrency('real', slotProps.data.price) }}
            </template>
          </Column>
          <Column field="sale" :header="$t('admin.sale')" sortable></Column>
          <Column field="servers" :header="$t('admin.servers')">
            <template #body="slotProps">
              <EntitySummary :items="slotProps.data.servers || []" />
            </template>
          </Column>
          <Column field="categories" :header="$t('admin.categories')">
            <template #body="slotProps">
              <EntitySummary :items="slotProps.data.categories || []" />
            </template>
          </Column>
          <Column :style="{ width: '7rem' }">
            <template #body="{ data }">
              <div class="products-actions">
                <Button v-if="canUpdateOn(data.servers)" @click="openDialog(data)" icon="pi pi-pencil" :aria-label="$t('admin.edit')" outlined />
                <Button v-if="canUpdateOn(data.servers) || (canDeleteOn(data.servers) && !data.important)" icon="pi pi-ellipsis-h" :aria-label="$t('admin.more_actions')" aria-haspopup="true" aria-controls="products-row-menu" text @click="openRowMenu($event, data)" />
              </div>
            </template>
          </Column>
        </DataTable>

        <Dialog v-model:visible="fileDialog" :style="{ width: '400px' }" :modal="true" :header="$t('admin.product_icon')" class="p-fluid">
          <div class="flex align-items-center justify-content-center flex-wrap w-full">
            <IconAvatar :path="product.icon" size="xlarge" />
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
            v-model:visible="productManyDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            :header="$t('admin.products_bulk_dialog')"
            class="p-fluid"
          >
            <div class="field">
              <label>{{ $t('admin.servers') }}</label>
              <MultiSelect
                display="chip"
                :filter="true"
                v-model="productMany.servers"
                :options="manyServerOptions"
                optionLabel="name"
                :placeholder="productMany.servers.length ? $t('admin.choose_servers') : $t('admin.unchanged')"
                class="p-column-filter"
              >
                <template #option="slotProps">
                  <div class="p-multiselect-representative-option">
                    <IconAvatar :path="slotProps.option.icon" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field">
              <label>{{ $t('admin.categories') }}</label>
              <AutoComplete
                v-model="productMany.categories"
                multiple
                :suggestions="categories"
                @complete="searchCategory($event)"
                optionLabel="name"
                appendTo="body"
                :placeholder="productMany.categories.length ? $t('admin.choose_categories') : $t('admin.unchanged')"
              >
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <IconAvatar :path="slotProps.option.icon" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </div>
            <div class="grid">
              <div class="col-6">
                <VeeField
                  v-model="productMany.price"
                  name="price"
                  :label="$t('admin.price')"
                  rules="min:0.01"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>{{ $t('admin.price') }}<FieldLock :allowed="canEditPrice()" /></label>
                    <InputNumber
                      :disabled="!canEditPrice()"
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
                  v-model="productMany.sale"
                  name="sale"
                  :label="$t('admin.sale')"
                  rules="min_value:0|max_value:99"
                  v-slot="{ value, errorMessage, handleChange, handleBlur }"
                >
                  <div class="field">
                    <label>{{ $t('admin.sale') }}<FieldLock :allowed="canEditPrice()" /></label>
                    <InputNumber
                      :disabled="!canEditPrice()"
                      suffix=" %"
                      :placeholder="$t('admin.unchanged')"
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
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideManyDialog" />
              <Button
                :disabled="loading || !meta.valid"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMany"
              />
            </template>
          </Dialog>
        </VeeForm>

        <VeeForm v-slot="{ meta }">
          <Dialog
            v-model:visible="importDialog"
            :closable="false"
            :style="{ width: '600px' }"
            :modal="true"
            :header="$t('admin.products_import_dialog')"
            class="p-fluid"
          >
            <div class="field">
              <label>{{ $t('admin.servers') }}</label>
              <MultiSelect
                display="chip"
                :filter="true"
                v-model="productMany.servers"
                :options="importServerOptions"
                optionLabel="name"
                :placeholder="productMany.servers.length ? $t('admin.choose_servers') : $t('admin.not_chosen')"
                class="p-column-filter"
              >
                <template #option="slotProps">
                  <div class="p-multiselect-representative-option">
                    <IconAvatar :path="slotProps.option.icon" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </MultiSelect>
            </div>
            <div class="field">
              <label>{{ $t('admin.categories') }}</label>
              <AutoComplete
                v-model="productMany.categories"
                multiple
                :suggestions="categories"
                @complete="searchCategory($event)"
                optionLabel="name"
                appendTo="body"
                :placeholder="productMany.categories.length ? $t('admin.choose_categories') : $t('admin.not_chosen')"
              >
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <IconAvatar :path="slotProps.option.icon" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </div>
            <div class="field">
              <FileUpload
                :disabled="loading"
                ref="importer"
                mode="basic"
                :customUpload="true"
                accept="zip,application/octet-stream,application/zip,application/x-zip,application/x-zip-compressed"
                :maxFileSize="1000000"
                label="Import"
                :chooseLabel="$t('admin.choose_file')"
              />
            </div>
            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideImportDialog" />
              <Button
                :disabled="loading || !meta.valid || !$_.get($refs, 'importer.files', []).length"
                :label="$t('admin.import_button')"
                icon="pi pi-check"
                class="p-button-text"
                @click="importItems"
              />
            </template>
          </Dialog>
        </VeeForm>

        <VeeForm v-slot="{ meta }">
          <SectionedDialog
            v-model:visible="productDialog"
            v-model="section"
            :sections="sections"
            :header="$t('admin.product_dialog')"
            width="620px"
            class="p-fluid"
          >
            <template #before>
              <div v-if="productFormError" role="alert" class="mb-3">
                <p class="p-error">{{ productFormError }}</p>
                <Button v-if="!productFormReady" :disabled="loading" :label="$t('admin.retry')" icon="pi pi-refresh" class="p-button-text" @click="loadProductExtensions" />
              </div>
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
                v-model="product.name"
                name="name"
                :label="$t('admin.name')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.name') }}<span class="p-error"> *</span></label>
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
              <VeeField
                v-model="product.give_method"
                name="give_method"
                :label="$t('admin.type')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.type') }}<span class="p-error"> *</span></label>
                  <Select
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    :options="giveMethods"
                    optionLabel="label"
                    optionValue="value"
                    appendTo="body"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <VeeField
                v-if="product.give_method === 0"
                v-model="product.item_id"
                name="item_id"
                :label="$t('admin.item_id')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.item_id') }}<span class="p-error"> *</span></label>
                  <InputText
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @blur="handleBlur"
                    :class="errorMessage && 'p-invalid'"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                </div>
              </VeeField>
              <div class="field" v-if="product.give_method === 0">
                <label>{{ $t('admin.nbt_tags') }}</label>
                <InputText v-model="product.nbt" />
              </div>
              <VeeField
                v-if="product.give_method === 1 || product.give_method === 2"
                v-model="product.commands"
                name="commands"
                :label="$t('admin.command')"
                rules="required"
                v-slot="{ value, errorMessage, handleChange }"
              >
                <div class="field">
                  <label>{{ $t('admin.commands') }}<span class="p-error"> *</span><FieldLock :allowed="canEditCommands(updateMode)" /></label>
                  <InputChips :modelValue="value" @update:modelValue="handleChange" :disabled="!canEditCommands(updateMode)" />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  <Divider align="left" type="dashed">
                    <b>{{ $t('admin.variables') }}</b>
                  </Divider>
                  <ul>
                    <li><code>{user.username}</code> — {{ $t('admin.var_username') }}</li>
                    <li><code>{product.name}</code> — {{ $t('admin.var_product_name') }}</li>
                    <li><code>{product.amount}</code> — {{ $t('admin.var_product_amount') }}</li>
                    <li><code>{server.id}</code> — {{ $t('admin.var_server_id') }}</li>
                    <li><code>{server.name}</code> — {{ $t('admin.var_server_name') }}</li>
                  </ul>
                  <Divider type="dashed" />
                </div>
              </VeeField>
              <VeeField
                v-model="product.multiple_of"
                name="multiple_of"
                :label="$t('admin.quantity')"
                rules="min_value:1"
                v-slot="{ value, errorMessage, handleChange, handleBlur }"
              >
                <div class="field">
                  <label>{{ $t('admin.quantity_multiple') }}</label>
                  <InputNumber
                    :modelValue="value"
                    @update:modelValue="handleChange"
                    @input="handleChange($event.value)"
                    @blur="handleBlur"
                  />
                  <small v-if="errorMessage" class="p-error">{{ errorMessage }}</small>
                  <small>{{ $t('admin.quantity_multiple_hint') }}</small>
                </div>
              </VeeField>
            </template>

            <template #content>
              <div class="field">
                <label>{{ $t('admin.description') }}</label>
                <RichEditor v-model="product.description" height="160px" />
              </div>
              <div class="field">
                <label>{{ $t('admin.servers') }}<span class="p-error"> *</span></label>
                <MultiSelect
                  display="chip"
                  :filter="true"
                  v-model="product.servers"
                  :options="serverOptions"
                  optionLabel="name"
                  :placeholder="$t('admin.choose_servers')"
                  class="p-column-filter"
                >
                  <template #option="slotProps">
                    <div class="p-multiselect-representative-option">
                      <IconAvatar :path="slotProps.option.icon" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </MultiSelect>
                <small v-if="!product.servers?.length" class="p-error">{{ $t('admin.servers_required') }}</small>
              </div>
              <div class="field">
                <label>{{ $t('admin.categories') }}</label>
                <AutoComplete
                  v-model="product.categories"
                  multiple
                  :suggestions="categories"
                  @complete="searchCategory($event)"
                  optionLabel="name"
                  appendTo="body"
                  :placeholder="$t('admin.choose_categories')"
                >
                  <template #option="slotProps">
                    <div class="flex align-items-center">
                      <IconAvatar :path="slotProps.option.icon" />
                      <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                    </div>
                  </template>
                </AutoComplete>
              </div>
            </template>

            <template #price>
              <div class="grid">
                <div class="col-6">
                  <VeeField
                    v-model="product.price"
                    name="price"
                    :label="$t('admin.price')"
                    rules="required|min:0.01"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.price') }}<span class="p-error"> *</span><FieldLock :allowed="canEditPrice(updateMode)" /></label>
                      <InputNumber
                        :disabled="!canEditPrice(updateMode)"
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
                    v-model="product.sale"
                    name="sale"
                    :label="$t('admin.sale')"
                    rules="min_value:0|max_value:99"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.sale') }}<FieldLock :allowed="canEditPrice(updateMode)" /></label>
                      <InputNumber
                        :disabled="!canEditPrice(updateMode)"
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
                  v-model="product.virtual_percent"
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
              <div class="field-checkbox">
                <Checkbox :binary="true" v-model="product.hidden" inputId="product-hidden" />
                <label for="product-hidden" class="flex align-items-center gap-1">
                  {{ $t('admin.hidden_item') }}
                  <i v-tooltip.right="$t('admin.hidden_item_hint')" class="pi pi-question-circle text-color-secondary" />
                </label>
              </div>
              <div class="field-checkbox">
                <Checkbox :binary="true" v-model="product.giftable" inputId="product-giftable" />
                <label for="product-giftable">{{ $t('admin.giftable') }}</label>
              </div>
            </template>

            <template #translation>
              <ContentTranslationFields :translations="translations" />
            </template>

            <template #after>
              <div v-show="translations.isDefault && section === 'main'">
                <ExtensionSlot v-if="productForm" :key="productFormKey" name="store.product.form" :form="productForm.context" :product="product" :disabled="loading" />
              </div>
            </template>

            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !productFormReady || !meta.valid || !product.servers.length"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="saveProduct"
              />
            </template>
          </SectionedDialog>
        </VeeForm>
      </div>
    </div>
  </div>
</template>

<script>
import { sortTransform } from '~/helpers'
import { FilterMatchMode } from '@primevue/core/api'
import { Form, Field } from 'vee-validate'
import { markRaw, nextTick } from 'vue'
import { AdminFormError, createAdminForm } from 'unicore-api/admin'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const translations = useContentTranslations('product')

    const rc = useRuntimeConfig()
    const { $t } = useNuxtApp()

    useHead({ title: computed(() => $t('admin.products')) })
    const createScope = useServerScope('panel.store.products.create')
    const updateScope = useServerScope('panel.store.products.update')
    const updateManyScope = useServerScope('panel.store.products.update.many')
    const importScope = useServerScope('panel.store.products.import')

    const access = useAccess({
      canCreate: 'panel.store.products.create',
      canUpdate: 'panel.store.products.update',
      canDelete: 'panel.store.products.delete',
      canDeleteMany: 'panel.store.products.delete.many',
      canUpdateMany: 'panel.store.products.update.many',
      canExport: 'panel.store.products.export',
      canImport: 'panel.store.products.import',
    })

    const scoped = useScopedAccess({
      canUpdateOn: 'panel.store.products.update',
      canDeleteOn: 'panel.store.products.delete',
    })

    const fields = useFieldAccess('store_product', {
      canEditPrice: 'price',
      canEditCommands: 'commands',
    })

    return {
      ...access,
      ...scoped,
      ...fields,
      createScope,
      updateScope,
      updateManyScope,
      importScope,
      translations,
      realDecimals: rc.public.realDecimals,
    }
  },
  data() {
    return {
      selected: null,
      rowActions: [],
      categories: null,
      servers: null,
      serversFilterd: null,
      products: {
        data: null,
        meta: {
          itemsPerPage: 20,
          totalItems: 0,
          currentPage: 0,
          totalPages: 0,
          sortBy: null,
        },
      },
      loading: true,
      updateMode: false,
      product: {
        id: null,
        name: null,
        description: null,
        price: null,
        sale: null,
        servers: [],
        categories: [],
        give_method: 0,
        commands: null,
        icon: null,
        item_id: null,
        nbt: null,
        virtual_percent: null,
        hidden: false,
        giftable: true,
        multiple_of: null,
      },
      productMany: {
        price: null,
        sale: null,
        servers: [],
        categories: [],
      },
      productManyDialog: false,
      importDialog: false,
      fileDialog: false,
      productDialog: false,
      productForm: null,
      productFormKey: 0,
      productFormReady: false,
      productFormError: null,
      productSavedPayload: null,
      section: 'main',
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        servers: { value: null, matchMode: FilterMatchMode.IN },
        categories: { value: null, matchMode: FilterMatchMode.IN },
      },
    }
  },
  computed: {
    sortValue() {
      const value = this.products.meta.sortBy
      return (Array.isArray(value) ? value[0]?.join(':') : value) || 'id:DESC'
    },
    transferActions() {
      return [
        ...(this.canImport ? [{ label: this.$t('admin.import'), icon: 'pi pi-download', disabled: this.loading, command: () => this.openImportDialog() }] : []),
        ...(this.canExport ? [{ label: this.$t('admin.export'), icon: 'pi pi-upload', disabled: !this.selected?.length || this.loading, command: () => this.exportItems() }] : []),
      ]
    },
    sortOptions() {
      return ['id', 'name', 'price', 'sale'].flatMap((field) => ['ASC', 'DESC'].map((direction) => ({
        label: `${field === 'id' ? 'ID' : this.$t(`admin.${field}`)} ${direction === 'ASC' ? '↑' : '↓'}`,
        value: `${field}:${direction}`,
      })))
    },
    manyServerOptions() {
      if (!this.updateManyScope) return this.servers

      const attached = (this.selected || []).flatMap((product) => (product.servers || []).map((server) => server.id || server))

      return this.servers.filter((server) => this.updateManyScope.includes(server.id) || attached.includes(server.id))
    },

    importServerOptions() {
      return this.importScope ? this.servers.filter((server) => this.importScope.includes(server.id)) : this.servers
    },

    serverOptions() {
      const scope = this.updateMode ? this.updateScope : this.createScope

      if (!scope) return this.servers

      const attached = (this.product?.servers || []).map((server) => server.id || server)

      return this.servers.filter((server) => scope.includes(server.id) || attached.includes(server.id))
    },

    sections() {
      const isDefault = this.translations.isDefault

      return [
        { key: 'main', label: 'admin.section_main', icon: 'pi pi-info-circle', hidden: !isDefault },
        { key: 'content', label: 'admin.section_content', icon: 'pi pi-align-left', hidden: !isDefault },
        { key: 'price', label: 'admin.section_price', icon: 'pi pi-wallet', hidden: !isDefault },
        { key: 'translation', label: 'admin.section_translation', icon: 'pi pi-language', hidden: isDefault },
      ]
    },
    giveMethods() {
      return [
        { label: this.$t('admin.give_method_item'), value: 0 },
        { label: this.$t('admin.give_method_commands'), value: 1 },
        { label: this.$t('admin.give_method_rcon'), value: 2 },
      ]
    },
  },

  mounted() {
    this.load()
  },
  beforeUnmount() {
    this.disposeProductForm()
  },
  watch: {
    productDialog(visible) {
      if (!visible) this.disposeProductForm()
    },
  },
  methods: {
    setSorting(value) {
      this.products.meta.sortBy = value
      this.products.meta.currentPage = 1
      this.load()
    },
    openRowMenu(event, product) {
      this.rowActions = [
        ...(this.canUpdateOn(product.servers) ? [{ label: this.$t('admin.product_icon'), icon: 'pi pi-images', command: () => this.openFileDialog(product) }] : []),
        ...(this.canDeleteOn(product.servers) && !product.important ? [{ label: this.$t('admin.delete'), icon: 'pi pi-trash', command: () => this.removeProduct(product.id) }] : []),
      ]
      this.$refs.rowMenu.toggle(event)
    },
    disposeProductForm() {
      this.productFormKey++
      this.productForm?.dispose()
      this.productForm = null
      this.productFormReady = false
      this.productFormError = null
      this.productSavedPayload = null
    },
    async loadProductExtensions() {
      const form = this.productForm
      if (!form) return
      this.loading = true
      this.productFormError = null
      try {
        await form.load()
        if (this.productForm === form) this.productFormReady = true
      } catch (error) {
        if (this.productForm === form) {
          this.productFormError = this.$t('admin.extension_form_load_failed', { module: error.moduleId })
          this.productFormReady = false
        }
      } finally {
        if (this.productForm === form) this.loading = false
      }
    },
    async load() {
      this.loading = true
      this.products = await this.$api
        .get('/store/products', {
          params: {
            page: this.products.meta.currentPage,
            limit: this.products.meta.itemsPerPage,
            sortBy: this.sortValue,
            search: this.filters.global.value,
            ...this.filtersTansformer(this.filters),
          },
        })
        .then((res) => res.data)
      this.servers = await this.$api.get('/servers').then((res) => res.data)

      this.productDialog = false
      this.productManyDialog = false
      this.importDialog = false
      this.fileDialog = false
      this.loading = false
      this.selected = null
    },
    filtersTansformer(filters) {
      const transformed = {}

      if (filters.servers.value) transformed['filter.servers'] = filters.servers.value.map((server) => server.id).join(',')

      if (filters.categories.value) transformed['filter.categories'] = filters.categories.value.map((category) => category.id).join(',')

      return transformed
    },
    onPage(event) {
      this.products.meta.currentPage = event.page + 1
      this.products.meta.itemsPerPage = event.rows

      this.load()
    },
    onSort(event) {
      this.setSorting(sortTransform(event.sortOrder, event.sortField))
    },
    onFilter() {
      this.products.meta.currentPage = 1
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
    async uploadIcon(event) {
      let formData = new FormData()
      formData.append('file', event.files[0])

      try {
        await this.$api.patch(`/store/products/icon/` + this.product.id, formData, {
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
        await this.$api.delete(`/store/products/icon/` + this.product.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.icon_deleted'),
          life: 3000,
        })
        await this.load()
      } catch {}
    },
    hideDialog() {
      this.disposeProductForm()
      this.productDialog = false
    },
    hideManyDialog() {
      this.productManyDialog = false
    },
    hideImportDialog() {
      this.importDialog = false
    },
    async openDialog(product = null) {
      this.disposeProductForm()
      const generation = this.productFormKey
      this.loading = true
      this.updateMode = !!product
      if (product) {
        this.product = this.$_.pick(product, this.$_.deepKeys(this.product))
        this.product.servers = this.servers.filter((srv) => this.product.servers.find((sv) => srv.id == sv.id))
      } else {
        this.product = {
          id: null,
          name: null,
          description: null,
          price: null,
          sale: null,
          item_id: null,
          give_method: 0,
          commands: null,
          servers: this.filters?.servers?.value || [],
          categories: this.filters?.categories?.value || [],
          icon: null,
          nbt: null,
          virtual_percent: null,
        hidden: false,
        giftable: true,
          multiple_of: null,
        }
      }
      this.translations.attach(this.product)
      try {
        await this.translations.load(product ? product.id : null)
      } catch (error) {
        if (generation === this.productFormKey) {
          this.loading = false
          this.$utils.notifyError(error)
        }
        return
      }
      if (generation !== this.productFormKey) return
      this.productForm = markRaw(createAdminForm('store.product', () => ({
        id: this.product.id,
        mode: this.updateMode ? 'edit' : 'create',
        value: this.product,
      })))
      this.productDialog = true
      this.loading = true
      await nextTick()
      await this.loadProductExtensions()
    },
    async openManyDialog() {
      this.productMany = {
        price: null,
        sale: null,
        servers: [],
        categories: [],
      }
      this.productManyDialog = true
    },
    async openImportDialog() {
      this.productMany = {
        price: null,
        sale: null,
        servers: [],
        categories: [],
      }
      this.importDialog = true
    },
    openFileDialog(product) {
      this.product = this.$_.pick(product, this.$_.deepKeys(this.product))
      this.fileDialog = true
    },
    async saveProduct() {
      if (this.loading || !this.productFormReady) return
      this.loading = true
      this.productFormError = null
      const creating = this.product.id == null
      try {
        await this.productForm.validate()
        const payload = this.$_.omit({
          ...this.product,
          servers: this.product.servers.map((server) => server.id),
          categories: this.product.categories.map((category) => category.id),
        }, 'id')
        const serialized = JSON.stringify(payload)
        if (this.productSavedPayload !== serialized) {
          if (this.product.id == null) {
            const { data } = await this.$api.post('/store/products', payload)
            this.product.id = data.id
            this.updateMode = true
          } else {
            await this.$api.patch('/store/products/' + this.product.id, payload)
          }
          this.productSavedPayload = serialized
        }

        await this.translations.save(this.product.id)
        await this.productForm.save()
        this.$toast.add({
          severity: 'success',
          detail: this.$t(creating ? 'admin.product_created' : 'admin.product_updated'),
          life: 3000,
        })
        await this.load()
      } catch (err) {
        this.loading = false
        if (err instanceof AdminFormError) {
          this.section = 'main'
          if (err.phase === 'load') this.productFormReady = false
          const key = err.phase === 'save' ? 'admin.extension_form_save_failed' : err.phase === 'load' ? 'admin.extension_form_load_failed' : 'admin.extension_form_invalid'
          this.productFormError = this.$t(key, { module: err.moduleId })
          return
        }
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data'),
          life: 3000,
        })
      }
    },
    async removeProduct(id) {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.confirm_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.delete('/store/products/' + id)
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.product_deleted'),
              life: 3000,
            })
          } catch {}
          await this.load()
        },
      })
    },
    async updateMany() {
      this.$confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.edit_many', { count: this.selected.length }),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.loading = true
          try {
            await this.$api.patch('/store/products/bulk', {
              products: this.selected.map((select) => {
                select = this.$_.pick(select, 'id')

                if (this.productMany.servers && this.productMany.servers.length)
                  select.servers = this.productMany.servers.map((server) => server.id)

                if (this.productMany.categories && this.productMany.categories.length)
                  select.categories = this.productMany.categories.map((category) => category.id)

                if (this.productMany.price) select.price = this.productMany.price

                if (this.productMany.sale || this.productMany.sale == 0) select.sale = this.productMany.sale

                return select
              }),
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.products_updated'),
              life: 3000,
            })
            await this.load()
          } catch {
            this.loading = false
            this.$toast.add({
              severity: 'error',
              detail: this.$t('admin.invalid_data'),
              life: 3000,
            })
          }
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
            await this.$api.delete('/store/products/bulk', {
              data: {
                items: this.selected.map((product) => product.id),
              },
            })
            this.$toast.add({
              severity: 'success',
              detail: this.$t('admin.products_deleted'),
              life: 3000,
            })
            this.selected = []
          } catch {}
          await this.load()
        },
      })
    },
    async importItems() {
      this.loading = true
      let formData = new FormData()
      formData.append('file', this.$refs.importer.files[0])

      if (this.productMany.servers && this.productMany.servers.length)
        formData.append(
          'servers',
          this.productMany.servers.map((server) => server.id),
        )

      if (this.productMany.categories && this.productMany.categories.length)
        formData.append(
          'categories',
          this.productMany.categories.map((category) => category.id),
        )

      try {
        const resp = await this.$api.post('/store/products/import', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.import_done', { count: resp.data.length }),
          life: 3000,
        })
        await this.load()
      } catch {
        this.fileDialog = false
        this.$toast.add({
          severity: 'error',
          detail: this.$t('admin.import_unsupported'),
          life: 3000,
        })
      }
      this.hideImportDialog()
      this.loading = false
    },
    async exportItems() {
      this.loading = true
      try {
        const response = await this.$api.post('/store/products/export', {
          items: this.selected.map((product) => product.id),
        })

        let link = document.createElement('a')
        link.href = 'data:application/zip;base64,' + response.data
        link.download = `${this.selected.length}-items.${this.$moment().format()}.zip`
        link.click()
      } catch {}
      this.loading = false
    },
  },
}
</script>

<style scoped>
.products-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.products-filters {
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}
.products-search {
  flex: 1 1 240px;
}
.products-search :deep(input) {
  width: 100%;
}
.products-filters > :not(.products-search) {
  flex: 1 1 180px;
  min-width: 0;
}
.products-name {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 180px;
}
.products-name :deep(.p-avatar) {
  flex-shrink: 0;
}
.products-name strong {
  font-size: 16px;
  overflow-wrap: anywhere;
}
.products-table :deep(td) {
  padding-block: 12px;
  vertical-align: middle;
}
.products-table :deep(.products-price) {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.products-table :deep(.products-price .p-datatable-column-header-content) {
  justify-content: flex-end;
}
.products-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.products-scroll-hint {
  display: none;
  font-size: 14px;
  margin: 0 0 12px;
}
@media (max-width: 1100px) {
  .products-scroll-hint {
    display: block;
  }
}
</style>
