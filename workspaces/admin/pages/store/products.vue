<template>
  <div class="grid">
    <div class="col-12">
      <div class="card">
        <Toolbar class="mb-4">
          <template #start>
            <div class="my-2">
              <Button v-if="canCreate" :label="$t('admin.create')" icon="pi pi-plus" class="p-button-success mr-2" @click="openDialog()" />
              <Button
                v-if="canUpdateMany"
                icon="pi pi-pencil"
                class="p-button-second mr-2"
                :disabled="!selected || !selected.length"
                @click="openManyDialog()"
              />
              <Button
                v-if="canDeleteMany"
                icon="pi pi-trash"
                class="p-button-danger"
                :disabled="!selected || !selected.length"
                @click="removeMany()"
              />
            </div>
          </template>

          <template #end>
            <Button
              v-if="canImport"
              :disabled="loading"
              :label="$t('admin.import')"
              icon="pi pi-plus"
              class="mr-2"
              @click="openImportDialog()"
            />
            <Button
              v-if="canExport"
              :disabled="!selected || !selected.length || loading"
              :label="$t('admin.export')"
              icon="pi pi-upload"
              class="p-button-help"
              @click="exportItems()"
            />
          </template>
        </Toolbar>
        <DataTable
          :value="products.data"
          :loading="loading"
          :rows="products.meta.itemsPerPage"
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
          <template #header>
            <div class="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
              <h5 class="m-0">{{ $t('admin.products_title') }}</h5>
              <span class="block mt-2 md:mt-0 p-input-icon-left">
                <i class="pi pi-search" />
                <InputText @keydown.enter="onFilter()" v-model="filters['global'].value" :placeholder="$t('admin.search')" />
              </span>
            </div>
          </template>
          <Column v-if="canDeleteMany" selectionMode="multiple" :style="{ width: '3rem' }"></Column>
          <Column field="id" header="ID" :style="{ width: '8rem' }" sortable></Column>
          <Column field="name" :header="$t('admin.name')" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center">
                <IconAvatar :path="slotProps.data.icon" />
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
                    <IconAvatar :path="slotProps.option.icon" />
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
                    <IconAvatar :path="slotProps.option.icon" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </AutoComplete>
            </template>
          </Column>
          <Column :style="{ width: '12rem' }" :bodyStyle="{ 'text-align': 'right' }">
            <template #body="slotProps">
              <Button
                v-if="canUpdateOn(slotProps.data.servers)"
                @click="openDialog(slotProps.data)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-success mr-2"
              />
              <Button
                  v-if="canUpdateOn(slotProps.data.servers)" @click="openFileDialog(slotProps.data)" icon="pi pi-images" class="p-button-rounded p-button-secondary mr-2" />
              <Button
                @click="removeProduct(slotProps.data.id)"
                v-if="canDeleteOn(slotProps.data.servers) && !slotProps.data.important"
                icon="pi pi-trash"
                class="p-button-rounded p-button-warning mt-2"
              />
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
                :options="servers"
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
                :options="servers"
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
                <Editor v-model="product.description" editorStyle="height: 160px">
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

            <template #footer>
              <Button :disabled="loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
              <Button
                :disabled="loading || !meta.valid || !product.servers.length"
                :label="$t('common.save')"
                icon="pi pi-check"
                class="p-button-text"
                @click="updateMode ? updateProduct() : createProduct()"
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
      translations,
      realDecimals: rc.public.realDecimals,
    }
  },
  data() {
    return {
      selected: null,
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
      section: 'main',
      filters: {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        servers: { value: null, matchMode: FilterMatchMode.IN },
        categories: { value: null, matchMode: FilterMatchMode.IN },
      },
    }
  },
  computed: {
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
  methods: {
    async load() {
      this.loading = true
      this.products = await this.$api
        .get('/store/products', {
          params: {
            page: this.products.meta.currentPage,
            limit: this.products.meta.itemsPerPage,
            sortBy: this.products.meta.sortBy,
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
      this.products.meta.sortBy = sortTransform(event.sortOrder, event.sortField)

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
      this.productDialog = false
    },
    hideManyDialog() {
      this.productManyDialog = false
    },
    hideImportDialog() {
      this.importDialog = false
    },
    async openDialog(product = null) {
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
      await this.translations.load(product ? product.id : null)
      this.productDialog = true
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
    async createProduct() {
      this.loading = true
      try {
        const { data } = await this.$api.post('/store/products', {
          ...this.product,
          servers: this.product.servers.map((server) => server.id),
          categories: this.product.categories.map((category) => category.id),
        })

        await this.translations.save(data.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.product_created'),
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
    async updateProduct() {
      this.loading = true
      try {
        await this.$api.patch(
          '/store/products/' + this.product.id,
          this.$_.omit(
            {
              ...this.product,
              servers: this.product.servers.map((server) => server.id),
              categories: this.product.categories.map((category) => category.id),
            },
            'id',
          ),
        )

        await this.translations.save(this.product.id)
        this.$toast.add({
          severity: 'success',
          detail: this.$t('admin.product_updated'),
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
