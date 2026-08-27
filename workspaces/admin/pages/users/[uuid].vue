<template>
  <div>
    <VeeForm as="div" v-slot="{ meta }">
      <Dialog
        v-model:visible="giveProductDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        :header="$t('admin.give_product_dialog')"
        class="p-fluid"
      >
        <VeeField
          v-model="whItem.server"
          name="server"
          :label="$t('cabinet.server')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('cabinet.server') }}<span class="p-error"> *</span></label>
            <Select :modelValue="value" @update:modelValue="handleChange" :options="giveServers" optionLabel="name" appendTo="body">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <IconAvatar :path="slotProps.option.icon" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Select>
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <VeeField
          v-model="whItem.product"
          name="product"
          :label="$t('cabinet.product')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('cabinet.product') }}<span class="p-error"> *</span></label>
            <AutoComplete
              :modelValue="value"
              @update:modelValue="handleChange"
              :suggestions="products"
              @complete="searchProduct($event)"
              :disabled="!whItem.server"
              :placeholder="whItem.server ? '' : $t('admin.choose_server_first')"
              optionLabel="name"
              appendTo="body"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <IconAvatar :path="slotProps.option.icon" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </AutoComplete>
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <VeeField
          v-model="whItem.amount"
          name="amount"
          :label="$t('admin.quantity')"
          rules="required|min:1"
          v-slot="{ value, errorMessage, handleChange, handleBlur }"
        >
          <div class="field">
            <label>{{ $t('admin.quantity') }}<span class="p-error"> *</span></label>
            <InputNumber :modelValue="value" @update:modelValue="handleChange" @input="handleChange($event.value)" @blur="handleBlur" />
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <template #footer>
          <Button :disabled="wh_loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideProductDialog" />
          <Button
            :disabled="wh_loading || !meta.valid"
            :label="$t('common.save')"
            icon="pi pi-check"
            class="p-button-text"
            @click="giveProduct()"
          />
        </template>
      </Dialog>
    </VeeForm>

    <VeeForm as="div" v-slot="{ meta }">
      <Dialog
        v-model:visible="giveKitDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        :header="$t('admin.give_kit_dialog')"
        class="p-fluid"
      >
        <VeeField
          v-model="whItem.server"
          name="server"
          :label="$t('cabinet.server')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('cabinet.server') }}<span class="p-error"> *</span></label>
            <Select :modelValue="value" @update:modelValue="handleChange" :options="giveServers" optionLabel="name" appendTo="body">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <IconAvatar :path="slotProps.option.icon" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Select>
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <VeeField v-model="whItem.kit" name="kit" :label="$t('store.kit')" rules="required" v-slot="{ value, errorMessage, handleChange }">
          <div class="field">
            <label>{{ $t('store.kit') }}<span class="p-error"> *</span></label>
            <AutoComplete
              :modelValue="value"
              @update:modelValue="handleChange"
              :suggestions="kits"
              @complete="searchKit($event)"
              :disabled="!whItem.server"
              :placeholder="whItem.server ? '' : $t('admin.choose_server_first')"
              optionLabel="name"
              appendTo="body"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <IconAvatar :path="slotProps.option.icon" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </AutoComplete>
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <template #footer>
          <Button :disabled="wh_loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideKitDialog" />
          <Button
            :disabled="wh_loading || !meta.valid"
            :label="$t('common.save')"
            icon="pi pi-check"
            class="p-button-text"
            @click="giveKit()"
          />
        </template>
      </Dialog>
    </VeeForm>

    <VeeForm as="div" v-slot="{ meta }">
      <Dialog
        v-model:visible="giveUDGDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        :header="$t('admin.give_group_dialog')"
        class="p-fluid"
      >
        <VeeField
          v-model="udgForm.server"
          name="server"
          :label="$t('cabinet.server')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('cabinet.server') }}<span class="p-error"> *</span></label>
            <Select :modelValue="value" @update:modelValue="handleChange" :options="donateServers" optionLabel="name" appendTo="body">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <IconAvatar :path="slotProps.option.icon" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Select>
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <VeeField
          v-model="udgForm.group"
          name="group"
          :label="$t('admin.group')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('admin.group') }}<span class="p-error"> *</span></label>
            <Select
              :modelValue="value"
              @update:modelValue="handleChange"
              :options="serverDonateGroups"
              :disabled="!udgForm.server"
              :placeholder="udgForm.server ? '' : $t('admin.choose_server_first')"
              optionLabel="name"
              appendTo="body"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <IconAvatar :path="slotProps.option.icon" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Select>
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <VeeField
          v-model="udgForm.period"
          name="period"
          :label="$t('cabinet.period')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('cabinet.period') }}<span class="p-error"> *</span></label>
            <Select :modelValue="value" @update:modelValue="handleChange" :options="periods" optionLabel="name" appendTo="body" />
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <template #footer>
          <Button :disabled="udg_loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideUDGDialog" />
          <Button
            :disabled="udg_loading || !meta.valid"
            :label="$t('common.save')"
            icon="pi pi-check"
            class="p-button-text"
            @click="giveDonateGroup()"
          />
        </template>
      </Dialog>
    </VeeForm>

    <VeeForm as="div" v-slot="{ meta }">
      <Dialog
        v-model:visible="giveUDPDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        :header="$t('admin.give_permission_dialog')"
        class="p-fluid"
      >
        <VeeField
          v-model="udpForm.permission"
          name="permission"
          :label="$t('admin.right')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('admin.right') }}<span class="p-error"> *</span></label>
            <Select :modelValue="value" @update:modelValue="handleChange" :options="donatePermissions" optionLabel="name" appendTo="body">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Select>
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <VeeField
          v-if="udpForm.permission && udpForm.permission.type != 'web'"
          v-model="udpForm.server"
          name="server"
          :label="$t('cabinet.server')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('cabinet.server') }}<span class="p-error"> *</span></label>
            <Select :modelValue="value" @update:modelValue="handleChange" :options="permissionServers" optionLabel="name" appendTo="body">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <IconAvatar :path="slotProps.option.icon" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Select>
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <VeeField
          v-model="udpForm.period"
          name="period"
          :label="$t('cabinet.period')"
          rules="required"
          v-slot="{ value, errorMessage, handleChange }"
        >
          <div class="field">
            <label>{{ $t('cabinet.period') }}<span class="p-error"> *</span></label>
            <Select :modelValue="value" @update:modelValue="handleChange" :options="periods" optionLabel="name" appendTo="body" />
            <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
          </div>
        </VeeField>
        <template #footer>
          <Button :disabled="udp_loading" :label="$t('common.cancel')" icon="pi pi-times" class="p-button-text" @click="hideUDPDialog" />
          <Button
            :disabled="udp_loading || !meta.valid"
            :label="$t('common.save')"
            icon="pi pi-check"
            class="p-button-text"
            @click="giveDonatePermission()"
          />
        </template>
      </Dialog>
    </VeeForm>

    <Tabs v-if="user" value="main">
      <TabList>
        <Tab value="main">{{ $t('admin.tab_main') }}</Tab>
        <Tab v-if="canBalanceReal || canBalanceBonus || canMoneyServers || canDonate || canGive" value="commerce">E-Commerce</Tab>
      </TabList>
      <TabPanels>
        <TabPanel value="main">
        <div class="grid" v-if="user">
          <div class="col-12 md:col-6">
            <div class="p-fluid p-4">
              <h4>{{ $t('admin.appearance') }}</h4>
              <div class="grid">
                <div class="col-12 flex justify-content-center">
                  <SkinView3D class="rounded" :width="210" :height="300" :skin="user.skin" :cloak="user.cloak" ref="skin" />
                </div>
                <div class="col-12 flex justify-content-center" v-if="canUpdate">
                  <div class="grid">
                    <div @click="$refs.skinInput.choose()" class="col-12 md:col-6">
                      <Button :label="$t('admin.upload_skin')" class="p-button mr-2 mb-2" />
                    </div>
                    <FileUpload
                      ref="skinInput"
                      :pt="{ root: { class: 'hidden' } }"
                      mode="basic"
                      name="file"
                      accept="image/png"
                      :auto="true"
                      :customUpload="true"
                      @uploader="uploadSkin($event, 'skin')"
                    />
                    <div class="col-12 md:col-6">
                      <Button @click="deleteSkin('skin')" :label="$t('admin.delete_skin')" class="p-button-danger p-button mr-2 mb-2" />
                    </div>
                    <div @click="$refs.cloakInput.choose()" class="col-12 md:col-6">
                      <Button :label="$t('admin.upload_cloak')" class="p-button mr-2 mb-2" />
                    </div>
                    <FileUpload
                      ref="cloakInput"
                      :pt="{ root: { class: 'hidden' } }"
                      mode="basic"
                      name="file"
                      accept="image/png"
                      :auto="true"
                      :customUpload="true"
                      @uploader="uploadSkin($event, 'cloak')"
                    />
                    <div class="col-12 md:col-6">
                      <Button @click="deleteSkin('cloak')" :label="$t('admin.delete_cloak')" class="p-button-danger p-button mr-2 mb-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-4" v-if="canBan">
              <VeeForm as="div" v-slot="{ meta }">
                <h4>{{ $t('admin.ban_block') }} ({{ user.ban ? $t('admin.yes') : $t('admin.no') }})</h4>
                <div class="p-fluid">
                  <VeeField
                    v-model="ban_model.reason"
                    name="reason"
                    :label="$t('admin.reason')"
                    rules="required"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.reason') }}<span class="p-error"> *</span></label>
                      <InputText :modelValue="value" @update:modelValue="handleChange" @blur="handleBlur" type="text" />
                      <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                  <div class="field">
                    <label>{{ $t('admin.expires_empty') }}</label>
                    <DatePicker v-model="ban_model.expires" showTime showSeconds appendTo="body" />
                  </div>
                </div>
                <Button :disabled="!meta.valid" @click="banCreate()" :label="$t('admin.ban_button')" class="p-button mr-2 mb-2" />
                <Button
                  @click="deleteBan()"
                  :disabled="!user.ban"
                  :label="$t('admin.unban_button')"
                  class="p-button-danger p-button mr-2 mb-2"
                />
              </VeeForm>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="p-4">
              <VeeForm v-if="canUpdate" as="div" v-slot="{ meta }">
                <div class="p-fluid">
                  <h4>{{ $t('admin.profile_of', { username: user.username }) }}</h4>
                  <VeeField
                    v-model="user.username"
                    name="username"
                    :label="$t('admin.username')"
                    rules="required|isUsername"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('admin.username') }}<span class="p-error"> *</span><FieldLock :allowed="canEditUsername" /></label>
                      <InputText
                        :modelValue="value"
                        :disabled="!canEditUsername"
                        @update:modelValue="handleChange"
                        @blur="handleBlur"
                        type="text"
                      />
                      <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                  <VeeField
                    v-model="user.email"
                    name="email"
                    label="Email"
                    rules="email"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>Email<FieldLock :allowed="canEditEmail" /></label>
                      <InputText
                        :modelValue="value"
                        :disabled="!canEditEmail"
                        @update:modelValue="handleChange"
                        @blur="handleBlur"
                        type="text"
                      />
                      <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                  <div class="field-checkbox">
                    <Checkbox :binary="true" v-model="user.activated" :disabled="!canEditActivated" />
                    <label>{{ $t('admin.activated_email') }}<FieldLock :allowed="canEditActivated" /></label>
                  </div>
                  <h4>{{ $t('admin.roles_and_rights') }}</h4>
                  <div class="field">
                    <label>{{ $t('admin.roles') }}<FieldLock :allowed="canEditRoles" /></label>
                    <MultiSelect
                      display="chip"
                      :filter="true"
                      :disabled="!canEditRoles"
                      v-model="rolesUser"
                      :options="roles"
                      optionLabel="name"
                      optionValue="id"
                      optionDisabled="important"
                      :placeholder="$t('admin.choose_roles')"
                      class="p-column-filter"
                    />
                  </div>
                  <PermissionsPicker v-model="user.perms" :label="$t('admin.rights')" :disabled="!canEditRoles" />
                  <div class="field-checkbox" v-if="canEditSuperuser">
                    <Checkbox :binary="true" v-model="user.superuser" />
                    <label>{{ $t('admin.superuser') }}</label>
                  </div>
                </div>
                <Button
                  :disabled="!meta.valid || !canUpdate"
                  @click="updateProfile()"
                  :label="$t('common.save')"
                  class="p-button mr-2 mb-4"
                />
              </VeeForm>
              <VeeForm v-if="canEditPassword || canResetTwoFactor || canCloseSessions" as="div" v-slot="{ meta }">
                <div class="p-fluid" v-if="canEditPassword">
                  <h4>{{ $t('admin.change_password') }}</h4>
                  <VeeField
                    v-model="passwordForm.password"
                    name="password"
                    :label="$t('auth.password')"
                    rules="required|min:8|max:128"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('auth.password') }}<span class="p-error"> *</span></label>
                      <div class="flex gap-2">
                        <InputText
                          autocomplete="false"
                          class="flex-1"
                          :modelValue="value"
                          @update:modelValue="handleChange"
                          @blur="handleBlur"
                          :placeholder="$t('admin.unchanged')"
                          :type="passwordVisible ? 'text' : 'password'"
                        />
                        <Button
                          type="button"
                          icon="pi pi-refresh"
                          class="p-button-secondary"
                          v-tooltip.bottom="$t('admin.password_generate')"
                          @click="fillGeneratedPassword(handleChange)"
                        />
                      </div>
                      <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                  <VeeField
                    v-model="passwordForm.password_confirm"
                    name="password_confirm"
                    :label="$t('auth.password_confirm')"
                    rules="required|confirmed:@password"
                    v-slot="{ value, errorMessage, handleChange, handleBlur }"
                  >
                    <div class="field">
                      <label>{{ $t('auth.password_confirm') }}<span class="p-error"> *</span></label>
                      <InputText
                        autocomplete="false"
                        :modelValue="value"
                        @update:modelValue="handleChange"
                        @blur="handleBlur"
                        :placeholder="$t('admin.unchanged')"
                        type="password"
                      />
                      <small v-show="errorMessage" class="p-error">{{ errorMessage }}</small>
                    </div>
                  </VeeField>
                  <Message severity="info" :closable="false">{{ $t('auth.sessions_closed_hint') }}</Message>
                </div>
                <Button
                  v-if="canEditPassword"
                  :disabled="!meta.valid"
                  @click="updatePassword()"
                  :label="$t('common.save')"
                  class="p-button mr-2 mb-2"
                />
                <Button
                  v-if="canResetTwoFactor"
                  :disabled="!user.two_factor_enabled"
                  @click="resetTwoFactor()"
                  :label="$t('admin.reset_2fa')"
                  class="p-button-danger p-button mr-2 mb-2"
                />
                <Button
                  v-if="canCloseSessions"
                  @click="closeSessions()"
                  :label="$t('admin.close_sessions')"
                  class="p-button-danger p-button mr-2 mb-2"
                />
              </VeeForm>
            </div>
          </div>
        </div>
        </TabPanel>
        <TabPanel v-if="canBalanceReal || canBalanceBonus || canMoneyServers || canDonate || canGive" value="commerce">
        <div class="grid">
          <div class="col-12" v-if="canBalanceReal || canBalanceBonus || canMoneyServers">
            <div class="p-4">
              <h4>{{ $t('admin.economy') }}</h4>
              <div class="p-fluid grid" v-if="canBalanceReal || canBalanceBonus">
                <div class="col-12 md:col-6" v-if="canBalanceReal">
                  <div class="field">
                    <label>{{ $t('admin.balance_real') }}</label>
                    <div class="grid">
                      <div class="col-12 md:col-7">
                        <InputNumber
                          v-model="user.real"
                          mode="decimal"
                          :minFractionDigits="rc.realDecimals"
                          :maxFractionDigits="rc.realDecimals"
                        />
                      </div>
                      <div class="col-12 md:col-5">
                        <Button @click="updateReal()" :label="$t('common.save')" class="p-button mr-2 mb-2" />
                      </div>
                    </div>
                  </div>
                </div>
                <div class="col-12 md:col-6" v-if="canBalanceBonus">
                  <div class="field">
                    <label>{{ $t('admin.balance_virtual') }}</label>
                    <div class="grid">
                      <div class="col-12 md:col-7">
                        <InputNumber
                          v-model="user.virtual"
                          mode="decimal"
                          :minFractionDigits="rc.virtualDecimals"
                          :maxFractionDigits="rc.virtualDecimals"
                        />
                      </div>
                      <div class="col-12 md:col-5">
                        <Button @click="updateVirtual()" :label="$t('common.save')" class="p-button mr-2 mb-2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DataTable v-if="canMoneyServers" :value="moneyRows" :loading="money_loading" responsiveLayout="scroll" dataKey="m.id">
                <Column field="m.server.name" :header="$t('cabinet.server')" sortable>
                  <template #body="slotProps">
                    <div class="flex align-items-center">
                      <IconAvatar :path="slotProps.data.server.icon" />
                      <span class="ml-2">{{ slotProps.data.server.name }}</span>
                    </div>
                  </template>
                </Column>
                <Column field="money" :header="$t('admin.quantity')" sortable>
                  <template #body="slotProps">
                    <InputNumber
                      type="text"
                      v-model="slotProps.data.money"
                      mode="decimal"
                      :minFractionDigits="rc.ingameDecimals"
                      :maxFractionDigits="rc.ingameDecimals"
                    />
                  </template>
                </Column>
                <Column :style="{ width: '4rem' }" :bodyStyle="{ 'text-align': 'right' }">
                  <template #body="slotProps">
                    <Button @click="updateMoney(slotProps.data.server.id)" icon="pi pi-check" class="p-button-rounded mt-2" />
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
          <div class="col-12 md:col-6 p-4">
            <div class="flex justify-content-between align-items-center">
              <h4>{{ $t('admin.menu_donate_groups') }}</h4>
              <Button v-if="canDonate" :label="$t('admin.give')" class="p-button mr-2 mb-2" @click="showUDGDialog()" />
            </div>
            <DataTable :value="udg" :loading="udg_loading" responsiveLayout="scroll" dataKey="m.id">
              <Column field="server" :header="$t('cabinet.server')">
                <template #body="slotProps">
                  <div class="flex align-items-center">
                    <IconAvatar :path="slotProps.data.server.icon" />
                    <span class="ml-2">{{ slotProps.data.server.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="group.name" :header="$t('admin.group')" sortable>
                <template #body="slotProps">
                  <div class="flex align-items-center">
                    <IconAvatar :path="slotProps.data.group.icon" />
                    <span class="ml-2">{{ slotProps.data.group.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="expired" :header="$t('admin.expires')" sortable>
                <template #body="slotProps">
                  {{ slotProps.data.expired ? $moment(slotProps.data.expired).format('D MMMM YYYY, HH:mm') : $t('players.never') }}
                </template>
              </Column>
              <Column :style="{ width: '4rem' }" :bodyStyle="{ 'text-align': 'right' }">
                <template #body="slotProps">
                  <Button
                    v-if="canDonate"
                    @click="takeDonateGroup(slotProps.data.id)"
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-danger mt-2"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="col-12 md:col-6 p-4">
            <div class="flex justify-content-between align-items-center">
              <h4>{{ $t('admin.menu_donate_permissions') }}</h4>
              <Button v-if="canDonate" :label="$t('admin.give')" class="p-button mr-2 mb-2" @click="showUDPDialog()" />
            </div>
            <DataTable :value="udp" :loading="udp_loading" responsiveLayout="scroll" dataKey="m.id">
              <Column field="server" :header="$t('cabinet.server')">
                <template #body="slotProps">
                  <div v-if="slotProps.data.server">
                    <div class="flex align-items-center">
                      <IconAvatar :path="slotProps.data.server.icon" />
                      <span class="ml-2">{{ slotProps.data.server.name }}</span>
                    </div>
                  </div>
                  <div v-else>{{ $t('admin.web_site') }}</div>
                </template>
              </Column>
              <Column field="permission.name" :header="$t('admin.right')" sortable />
              <Column field="expired" :header="$t('admin.expires')" sortable>
                <template #body="slotProps">
                  {{ slotProps.data.expired ? $moment(slotProps.data.expired).format('D MMMM YYYY, HH:mm') : $t('players.never') }}
                </template>
              </Column>
              <Column :style="{ width: '4rem' }" :bodyStyle="{ 'text-align': 'right' }">
                <template #body="slotProps">
                  <Button
                    v-if="canDonate"
                    @click="takeDonatePermission(slotProps.data.id)"
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-danger mt-2"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="col-12 p-4">
            <div class="flex align-items-center justify-content-between">
              <h4>{{ $t('admin.warehouse') }}</h4>
              <Select
                @change="warehouseFetch()"
                v-model="warehouse_server"
                :options="giveServers"
                optionLabel="name"
                appendTo="body"
                style="min-width: 150px"
              >
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <IconAvatar :path="slotProps.option.icon" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </Select>
            </div>
            <Button v-if="canGive" :label="$t('admin.give_product')" class="p-button mr-2 mb-2" @click="showProductDialog()" />
            <Button v-if="canGive" :label="$t('admin.give_kit')" class="p-button mr-2 mb-2" @click="showKitDialog()" />
            <DataTable :value="warehouse" :loading="wh_loading" responsiveLayout="scroll" dataKey="id">
              <Column field="id" header="ID" :style="{ width: '8rem' }" sortable></Column>
              <Column field="name" :header="$t('admin.name')" sortable>
                <template #body="slotProps">
                  <div class="flex align-items-center">
                    <IconAvatar :path="slotProps.data.product.icon" />
                    <span class="ml-2">{{ slotProps.data.product.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="price" :header="$t('admin.quantity')" sortable>
                <template #body="slotProps"> {{ $t('store.pieces', { amount: slotProps.data.amount }) }} </template>
              </Column>
              <Column field="categories" :header="$t('admin.categories')" filterField="categories" :showFilterMatchModes="false">
                <template #body="slotProps">
                  <Tag
                    class="mr-2 mb-2"
                    v-for="category in slotProps.data.product.categories"
                    :key="category.id"
                    :value="category.name"
                  ></Tag>
                </template>
              </Column>
              <Column :style="{ width: '4rem' }" :bodyStyle="{ 'text-align': 'right' }">
                <template #body="slotProps">
                  <Button
                    v-if="canGive"
                    @click="removeWHItem(slotProps.data.id)"
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-warning mt-2"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
        </TabPanel>
      </TabPanels>
    </Tabs>

    <ExtensionSlot name="users.profile" :user="user" />
  </div>
</template>

<script>
import { Form, Field } from 'vee-validate'
import { useAuthStore } from '~/stores/auth'
import { generatePassword } from 'unicore-common/password'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

export default {
  components: {
    VeeForm: Form,
    VeeField: Field,
  },
  setup() {
    const rc = useRuntimeConfig()
    const route = useRoute()
    const toast = useToast()
    const confirm = useConfirm()

    const access = useAccess({
      canUpdate: 'panel.users.update',
      canBan: 'panel.users.ban',
      canResetTwoFactor: 'panel.users.twofactor.reset',
      canCloseSessions: 'panel.users.sessions.revoke',
    })

    const fields = useFieldAccess('user', {
      canEditUsername: 'username',
      canEditEmail: 'email',
      canEditPassword: 'password',
      canEditActivated: 'activated',
      canEditRoles: 'roles',
      canEditSuperuser: 'superuser',
    })

    return { rc: rc.public, route, toast, confirm, ...access, ...fields }
  },
  data() {
    return {
      servers: [],
      periods: [],
      donatePermissions: [],
      donateGroups: [],
      money: [],
      udg: [],
      udp: [],
      products: null,
      kits: null,
      user: null,
      warehouse: [],
      rolesUser: [],
      roles: [],
      warehouse_server: null,
      udg_loading: false,
      udp_loading: false,
      wh_loading: false,
      money_loading: false,
      giveProductDialog: false,
      giveKitDialog: false,
      giveUDGDialog: false,
      giveUDPDialog: false,
      whItem: {
        amount: null,
        server: null,
        kit: null,
        product: null,
      },
      ban_model: {
        expires: null,
        reason: null,
      },
      passwordVisible: false,
      passwordForm: {
        password: null,
        password_confirm: null,
      },
      ban: null,
      udgForm: {
        server: null,
        group: null,
        period: null,
      },
      udpForm: {
        server: null,
        permission: null,
        period: null,
      },
    }
  },

  computed: {
    canBalanceReal() {
      return this.hasPermission('panel.users.balance.real')
    },

    canBalanceBonus() {
      return this.hasPermission('panel.users.balance.bonus')
    },

    canMoneyServers() {
      return this.hasPermission('panel.users.money.*')
    },

    canGive() {
      return this.hasPermission('panel.users.give')
    },

    canDonate() {
      return this.hasPermission('panel.users.donate')
    },

    serverDonateGroups() {
      if (!this.udgForm.server) return []

      return this.donateGroups.filter((group) => group.servers?.some((server) => server.id == this.udgForm.server.id))
    },

    permissionServers() {
      const permission = this.udpForm.permission
      const allowed = this.donateServers

      if (!permission?.servers?.length) return allowed

      return allowed.filter((server) => permission.servers.some((entry) => entry.id == server.id))
    },

    donateServers() {
      return this.servers.filter((server) => this.hasServerPermission('panel.users.donate', server.id))
    },

    giveServers() {
      return this.servers.filter((server) => this.hasServerPermission('panel.users.give', server.id))
    },

    moneyRows() {
      return this.money.filter((row) => this.hasServerPermission('panel.users.money', row.server?.id))
    },
  },

  watch: {
    'whItem.server'() {
      this.whItem.product = null
      this.whItem.kit = null
      this.products = []
      this.kits = []
    },

    'udgForm.server'() {
      this.udgForm.group = null
    },

    'udpForm.permission'() {
      this.udpForm.server = null
    },
  },

  mounted() {
    this.load()
  },

  methods: {
    fillGeneratedPassword(handleChange) {
      const password = generatePassword()

      this.passwordForm.password = password
      this.passwordForm.password_confirm = password
      this.passwordVisible = true

      handleChange(password)
    },

    hasPermission(permission) {
      return useAuthStore().has(permission)
    },

    hasServerPermission(permission, serverId) {
      return useAuthStore().has(serverId ? `${permission}.${serverId}` : permission)
    },

    async load() {
      const optional = (url) => this.$api.get(url, { silent: true }).then((res) => res.data).catch(() => [])

      const [roles, servers, periods, donatePermissions, donateGroups] = await Promise.all([
        optional('/admin/roles'),
        optional('/servers'),
        optional('/donates/periods'),
        optional('/donates/permissions'),
        optional('/donates/groups'),
      ])

      this.roles = roles
      this.servers = servers
      this.periods = periods
      this.donatePermissions = donatePermissions
      this.donateGroups = donateGroups

      await this.fetchUser()

      if (this.servers.length) {
        this.warehouse_server = this.giveServers[0] || null
        this.warehouseFetch()
        this.moneyFetch()
        this.udgFetch()
        this.udpFetch()
      }
    },

    async fetchUser() {
      this.user = await this.$api.get('/users/' + this.route.params.uuid).then((res) => res.data)
      this.rolesUser = this.roles.filter((role) => this.user.roles.find((ur) => ur.id == role.id)).map((r) => r.id)

      if (this.user.ban) {
        if (this.user.ban.expires) this.ban_model.expires = this.$moment(this.user.ban.expires).toDate()
        else this.ban_model.expires = null
        this.ban_model.reason = this.user.ban.reason
      } else {
        this.ban_model.expires = null
        this.ban_model.reason = null
      }
    },

    async warehouseFetch() {
      this.wh_loading = true
      this.warehouse = await this.$api
        .get(`/store/warehouse/admin/${this.user.uuid}/${this.warehouse_server.id}`)
        .then((res) => res.data)
        .catch(() => [])
      this.wh_loading = false
    },

    async moneyFetch() {
      this.money_loading = true
      this.money = await this.$api
        .get(`/cabinet/money/admin/` + this.user.uuid)
        .then((res) => res.data)
        .catch(() => [])
      this.money_loading = false
    },

    async udgFetch() {
      this.udg_loading = true
      this.udg = await this.$api
        .get(`/donates/groups/admin/${this.user.uuid}`)
        .then((res) => res.data)
        .catch(() => [])
      this.giveUDGDialog = false
      this.udg_loading = false
    },

    async udpFetch() {
      this.udp_loading = true
      this.udp = await this.$api
        .get(`/donates/permissions/admin/${this.user.uuid}`)
        .then((res) => res.data)
        .catch(() => [])
      this.giveUDPDialog = false
      this.udp_loading = false
    },

    async updateMoney(server_id) {
      this.money_loading = true
      await this.$api.patch('/cabinet/money/admin', {
        type: 1,
        uuid: this.user.uuid,
        server: server_id,
        amount: this.money.find((srv) => srv.server.id == server_id).money,
      })
      await this.moneyFetch()
    },

    async updateReal() {
      await this.$api.patch('/cabinet/money/admin', {
        type: 0,
        uuid: this.user.uuid,
        amount: this.user.real,
      })
      await this.fetchUser()
      this.toast.add({
        severity: 'success',
        detail: this.$t('admin.balance_updated'),
        life: 3000,
      })
    },

    async updateVirtual() {
      await this.$api.patch('/cabinet/votes/admin', {
        uuid: this.user.uuid,
        amount: this.user.virtual,
      })
      await this.fetchUser()
      this.toast.add({
        severity: 'success',
        detail: this.$t('admin.balance_updated'),
        life: 3000,
      })
    },

    async updateProfile() {
      try {
        await this.$api.patch('/users/' + this.user.uuid, {
          username: this.user.username,
          email: this.user.email,
          ...(this.isSuperuser ? { superuser: this.user.superuser } : {}),
          activated: this.user.activated,
          roles: this.rolesUser,
          perms: this.user.perms,
        })
        await this.fetchUser()
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.profile_updated'),
          life: 3000,
        })
      } catch {
        this.toast.add({
          severity: 'error',
          detail: this.$t('admin.profile_update_error'),
          life: 3000,
        })
      }
    },

    async updatePassword() {
      try {
        await this.$api.patch('/users/' + this.user.uuid + '/password', this.passwordForm)
        await this.fetchUser()
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.user_password_updated'),
          life: 3000,
        })
      } catch {
        this.toast.add({
          severity: 'error',
          detail: this.$t('admin.invalid_data_short'),
          life: 3000,
        })
      }
    },

    resetTwoFactor() {
      this.confirm.require({
        message: this.$t('admin.reset_2fa_confirm'),
        header: this.$t('admin.reset_2fa'),
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: this.$t('admin.reset_2fa'),
        rejectLabel: this.$t('common.cancel'),
        accept: async () => {
          try {
            await this.$api.delete('/users/' + this.user.uuid + '/2fa')
            await this.fetchUser()
            this.toast.add({ severity: 'success', detail: this.$t('admin.reset_2fa_done'), life: 3000 })
          } catch {
            this.toast.add({ severity: 'error', detail: this.$t('admin.invalid_data_short'), life: 3000 })
          }
        },
      })
    },

    closeSessions() {
      this.confirm.require({
        message: this.$t('admin.close_sessions_confirm'),
        header: this.$t('admin.close_sessions'),
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: this.$t('admin.close_sessions'),
        rejectLabel: this.$t('common.cancel'),
        accept: async () => {
          try {
            await this.$api.delete('/users/' + this.user.uuid + '/sessions')
            this.toast.add({ severity: 'success', detail: this.$t('admin.close_sessions_done'), life: 3000 })
          } catch {
            this.toast.add({ severity: 'error', detail: this.$t('admin.invalid_data_short'), life: 3000 })
          }
        },
      })
    },

    async uploadSkin(event, type) {
      let formData = new FormData()
      formData.append('file', event.files[0])
      try {
        await this.$api.patch(`/cabinet/skin/${type}/${this.user.uuid}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.skin_updated'),
          life: 3000,
        })
        await this.fetchUser()
      } catch {
        this.toast.add({
          severity: 'error',
          detail: this.$t('admin.skin_invalid'),
          life: 3000,
        })
      }

      this.$refs.skinInput.clear()
      this.$refs.cloakInput.clear()
    },

    async deleteSkin(type) {
      await this.$api.delete(`/cabinet/skin/${type}/${this.user.uuid}`)
      await this.fetchUser()
      this.toast.add({
        severity: 'success',
        detail: this.$t('admin.skin_deleted'),
        life: 3000,
      })
    },

    async takeDonateGroup(id) {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.group_revoke'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.udg_loading = true
          try {
            await this.$api.delete(`/donates/groups/admin/` + id)
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.group_revoked'),
              life: 3000,
            })
          } catch {}
          await this.udgFetch()
        },
      })
    },

    async giveDonateGroup() {
      this.udg_loading = true
      try {
        await this.$api.post(`/donates/groups/admin/give`, {
          server_id: this.udgForm.server.id,
          period_id: this.udgForm.period.id,
          group_id: this.udgForm.group.id,
          user_uuid: this.user.uuid,
        })
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.group_given'),
          life: 3000,
        })
      } catch {}
      await this.udgFetch()
      this.udg_loading = false
    },

    async giveDonatePermission() {
      this.udp_loading = true
      try {
        var form = {
          period_id: this.udpForm.period.id,
          permission_id: this.udpForm.permission.id,
          user_uuid: this.user.uuid,
        }

        if (this.udpForm.permission.type != 'web') form.server_id = this.udpForm.server.id

        await this.$api.post(`/donates/permissions/admin/give`, form)
        this.toast.add({
          severity: 'success',
          detail: this.$t('admin.permission_given'),
          life: 3000,
        })
      } catch {}
      await this.udpFetch()
      this.udp_loading = false
    },

    async takeDonatePermission(id) {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.permission_revoke'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.udp_loading = true
          try {
            await this.$api.delete(`/donates/permissions/admin/` + id)
            this.toast.add({
              severity: 'success',
              detail: this.$t('admin.permission_revoked'),
              life: 3000,
            })
          } catch {}
          await this.udpFetch()
        },
      })
    },

    async banCreate() {
      await this.$api.post(`/bans/admin`, {
        user_uuid: this.user.uuid,
        expires: this.ban_model.expires,
        reason: this.ban_model.reason,
      })
      await this.fetchUser()
      this.toast.add({
        severity: 'success',
        detail: this.$t('admin.ban_updated'),
        life: 3000,
      })
    },

    async deleteBan() {
      await this.$api.delete(`/bans/admin/${this.user.uuid}`)
      await this.fetchUser()
      this.toast.add({
        severity: 'success',
        detail: this.$t('admin.ban_removed'),
        life: 3000,
      })
    },

    async removeWHItem(id) {
      this.confirm.require({
        message: this.$t('admin.irreversible'),
        header: this.$t('admin.warehouse_item_delete'),
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.wh_loading = true
          try {
            await this.$api.delete(`/store/warehouse/admin/` + id).then((res) => res.data)
          } catch {}
          await this.warehouseFetch()
          this.wh_loading = false
        },
      })
    },
    showProductDialog() {
      this.whItem = {
        amount: null,
        server: null,
        kit: null,
        product: null,
      }
      this.giveProductDialog = true
    },
    hideProductDialog() {
      this.giveProductDialog = false
    },
    showKitDialog() {
      this.whItem = {
        amount: null,
        server: null,
        kit: null,
        product: null,
      }
      this.giveKitDialog = true
    },
    hideKitDialog() {
      this.giveKitDialog = false
    },
    showUDGDialog() {
      this.udgForm = {
        server: null,
        group: null,
        period: null,
      }
      this.giveUDGDialog = true
    },
    showUDPDialog() {
      this.udpForm = {
        server: null,
        permission: null,
        period: null,
      }
      this.giveUDPDialog = true
    },
    hideUDGDialog() {
      this.giveUDGDialog = false
    },
    hideUDPDialog() {
      this.giveUDPDialog = false
    },
    searchParams(query) {
      const params = { search: query.trim() }

      if (this.whItem.server) params['filter.servers'] = this.whItem.server.id

      return params
    },
    async searchProduct(event) {
      this.products = await this.$api.get('/store/products', { params: this.searchParams(event.query) }).then((res) => res.data.data)
    },
    async searchKit(event) {
      this.kits = await this.$api.get('/store/kits', { params: this.searchParams(event.query) }).then((res) => res.data.data)
    },
    async giveProduct() {
      this.wh_loading = true
      try {
        await this.$api
          .post(`/store/cart/admin/give/product`, {
            amount: this.whItem.amount,
            server_id: this.whItem.server.id,
            product_id: this.whItem.product.id,
            user_uuid: this.user.uuid,
          })
          .then((res) => res.data)
      } catch {}
      await this.warehouseFetch()
      this.wh_loading = false
      this.hideProductDialog()
    },
    async giveKit() {
      this.wh_loading = true
      try {
        await this.$api
          .post(`/store/cart/admin/give/kit`, {
            server_id: this.whItem.server.id,
            kit_id: this.whItem.kit.id,
            user_uuid: this.user.uuid,
          })
          .then((res) => res.data)
      } catch {}
      await this.warehouseFetch()
      this.wh_loading = false
      this.hideKitDialog()
    },
  },
}
</script>
