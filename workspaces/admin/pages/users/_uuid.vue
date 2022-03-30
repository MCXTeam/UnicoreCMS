<template>
  <div>
    <ValidationObserver v-slot="{ invalid }">
      <Dialog
        :visible.sync="giveProductDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        header="Выдача товара игроку"
        class="p-fluid"
      >
        <div class="field">
          <label>Сервер</label>
          <ValidationProvider name="Сервер" rules="required" v-slot="{ errors }">
            <Dropdown v-model="whItem.server" :options="servers" optionLabel="name" appendTo="body">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                  <Avatar v-else icon="pi pi-image" shape="circle" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Dropdown>
            <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
          </ValidationProvider>
        </div>
        <div class="field">
          <label>Товар</label>
          <ValidationProvider name="Товар" rules="required" v-slot="{ errors }">
            <AutoComplete v-model="whItem.product" :suggestions="products" @complete="searchProduct($event)" field="name" appendTo="body">
              <template #item="slotProps">
                <div class="flex align-items-center">
                  <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                  <Avatar v-else icon="pi pi-image" shape="circle" />
                  <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                </div>
              </template>
            </AutoComplete>
            <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
          </ValidationProvider>
        </div>
        <div class="field">
          <ValidationProvider name="Количество" rules="required|min:1" v-slot="{ errors }">
            <div class="field">
              <label>Количество</label>
              <InputNumber v-model="whItem.amount" />
              <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
            </div>
          </ValidationProvider>
        </div>
        <template #footer>
          <Button :disabled="wh_loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideProductDialog" />
          <Button :disabled="wh_loading || invalid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="giveProduct()" />
        </template>
      </Dialog>
    </ValidationObserver>

    <ValidationObserver v-slot="{ invalid }">
      <Dialog
        :visible.sync="giveKitDialog"
        :closable="false"
        :style="{ width: '450px' }"
        :modal="true"
        header="Выдача кита игроку"
        class="p-fluid"
      >
        <div class="field">
          <label>Сервер</label>
          <ValidationProvider name="Сервер" rules="required" v-slot="{ errors }">
            <Dropdown v-model="whItem.server" :options="servers" optionLabel="name" appendTo="body">
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                  <Avatar v-else icon="pi pi-image" shape="circle" />
                  <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                </div>
              </template>
            </Dropdown>
            <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
          </ValidationProvider>
        </div>
        <div class="field">
          <label>Кит</label>
          <ValidationProvider name="Кит" rules="required" v-slot="{ errors }">
            <AutoComplete v-model="whItem.kit" :suggestions="kits" @complete="searchKit($event)" field="name" appendTo="body">
              <template #item="slotProps">
                <div class="flex align-items-center">
                  <Avatar v-if="slotProps.item.icon" :image="`${$config.apiUrl + '/' + slotProps.item.icon}`" shape="circle" />
                  <Avatar v-else icon="pi pi-image" shape="circle" />
                  <span class="ml-2">{{ slotProps.item.name }} (#{{ slotProps.item.id }})</span>
                </div>
              </template>
            </AutoComplete>
            <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
          </ValidationProvider>
        </div>
        <template #footer>
          <Button :disabled="wh_loading" label="Отмена" icon="pi pi-times" class="p-button-text" @click="hideKitDialog" />
          <Button :disabled="wh_loading || invalid" label="Сохранить" icon="pi pi-check" class="p-button-text" @click="giveKit()" />
        </template>
      </Dialog>
    </ValidationObserver>

    <TabView v-if="user">
      <TabPanel header="Основное">
        <div class="grid" v-if="user">
          <div class="col-12 md:col-6">
            <div class="p-fluid p-4">
              <h4>Внешний вид</h4>
              <div class="grid">
                <div class="col-12 flex justify-content-center">
                  <SkinView3D class="rounded" :width="210" :height="300" :skin="user.skin" :cloak="user.cloak" ref="skin" />
                </div>
                <div class="col-12 flex justify-content-center">
                  <div class="grid">
                    <div @click="$refs.skinInput.choose()" class="col-12 md:col-6">
                      <Button label="Загрузить скин" class="p-button mr-2 mb-2" />
                    </div>
                    <FileUpload
                      ref="skinInput"
                      style="display: none"
                      mode="basic"
                      name="file"
                      accept="image/png"
                      :auto="true"
                      :customUpload="true"
                      @uploader="uploadSkin($event, 'skin')"
                    />
                    <div class="col-12 md:col-6">
                      <Button @click="deleteSkin('skin')" label="Удалить скин" class="p-button-danger p-button mr-2 mb-2" />
                    </div>
                    <div @click="$refs.cloakInput.choose()" class="col-12 md:col-6">
                      <Button label="Загрузить плащ" class="p-button mr-2 mb-2" />
                    </div>
                    <FileUpload
                      ref="cloakInput"
                      style="display: none"
                      mode="basic"
                      name="file"
                      accept="image/png"
                      :auto="true"
                      :customUpload="true"
                      @uploader="uploadSkin($event, 'cloak')"
                    />
                    <div class="col-12 md:col-6">
                      <Button @click="deleteSkin('cloak')" label="Удалить плащ" class="p-button-danger p-button mr-2 mb-2" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="p-4">
              <ValidationObserver v-slot="{ invalid }">
                <h4>Блокировка ({{ user.ban ? 'Да' : 'Нет' }})</h4>
                <div class="p-fluid">
                  <ValidationProvider name="Причина" rules="required" v-slot="{ errors }">
                    <div class="field">
                      <label>Причина</label>
                      <InputText v-model="ban_model.reason" type="text" />
                      <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                    </div>
                  </ValidationProvider>
                  <div class="field">
                    <label>Истекает (пусто - нет)</label>
                    <Calendar v-model="ban_model.expires" showTime showSeconds appendTo="body" />
                  </div>
                </div>
                <Button :disabled="invalid" @click="banCreate()" label="Заблокировать/редактировать" class="p-button mr-2 mb-2" />
                <Button @click="deleteBan()" :disabled="!user.ban" label="Разблокировать" class="p-button-danger p-button mr-2 mb-2" />
              </ValidationObserver>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="p-4">
              <ValidationObserver v-slot="{ invalid }" tag="form">
                <div class="p-fluid">
                  <h4>Профиль {{ user.username }}</h4>
                  <div class="field">
                    <ValidationProvider name="Имя пользователя" rules="required|isUsername" v-slot="{ errors }">
                      <label>Имя пользователя</label>
                      <InputText v-model="user.username" type="text" />
                      <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                    </ValidationProvider>
                  </div>
                  <div class="field">
                    <ValidationProvider name="Email" rules="email" v-slot="{ errors }">
                      <label>Email</label>
                      <InputText v-model="user.email" type="text" />
                      <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                    </ValidationProvider>
                  </div>
                  <div class="field-checkbox">
                    <Checkbox :binary="true" v-model="user.activated" />
                    <label>Активирован (Email)</label>
                  </div>
                  <h4>Роли и права</h4>
                  <div class="field">
                    <label>Роли</label>
                    <MultiSelect
                      display="chip"
                      :filter="true"
                      v-model="rolesUser"
                      :options="roles"
                      optionLabel="name"
                      optionValue="id"
                      optionDisabled="important"
                      placeholder="Выберите роли"
                      class="p-column-filter"
                    />
                  </div>
                  <div class="field">
                    <label>Права</label>
                    <span class="p-fluid">
                      <AutoComplete
                        v-model="user.perms"
                        :multiple="true"
                        :suggestions="autocompleateFilterd"
                        @complete="searchAutocompleate($event)"
                        appendTo="body"
                        :completeOnFocus="true"
                        placeholder="Выберите разрешения"
                      />
                    </span>
                  </div>
                  <div class="field-checkbox">
                    <Checkbox :binary="true" v-model="user.superuser" />
                    <label>Суперпользователь</label>
                  </div>
                </div>
                <Button :disabled="invalid" @click="updateProfile()" label="Сохранить" class="p-button mr-2 mb-4" />
              </ValidationObserver>
              <ValidationObserver v-slot="{ invalid }" tag="form" autocomplete="off">
                <div class="p-fluid">
                  <h4>Сменить пароль</h4>
                  <div class="field">
                    <ValidationProvider class="w-100" name="password" rules="required|min:6|max:32" v-slot="{ errors }">
                      <label>Пароль</label>
                      <InputText autocomplete="false" v-model="passwordForm.password" placeholder="Без изменений" type="password" />
                      <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                    </ValidationProvider>
                  </div>
                  <div class="field">
                    <ValidationProvider class="w-100" name="Подтверждение пароля" rules="required|confirmed:password" v-slot="{ errors }">
                      <label>Подтверждение пароля</label>
                      <InputText autocomplete="false" v-model="passwordForm.password_confirm" placeholder="Без изменений" type="password" />
                      <small v-show="errors[0]" class="p-error" v-text="errors[0]"></small>
                    </ValidationProvider>
                  </div>
                  <div class="field-checkbox">
                    <Checkbox :binary="true" v-model="passwordForm.close" />
                    <label>Закрыть все сеансы</label>
                  </div>
                </div>
                <Button :disabled="invalid" @click="updatePassword()" label="Сохранить" class="p-button mr-2 mb-2" />
                <Button label="Сбросить 2FA" class="p-button-danger p-button mr-2 mb-2" />
              </ValidationObserver>
            </div>
          </div>
        </div>
      </TabPanel>
      <TabPanel header="E-Commerce">
        <div class="grid">
          <div class="col-12">
            <div class="p-4">
              <h4>Экономика</h4>
              <div class="p-fluid">
                <div class="field">
                  <label>Баланс на сайте</label>
                  <div class="grid">
                    <div class="col-12 md:col-4">
                      <InputNumber type="text" v-model="user.real" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" />
                    </div>
                    <div class="col-12 md:col-3">
                      <Button @click="updateReal()" label="Сохранить" class="p-button mr-2 mb-2" />
                    </div>
                  </div>
                </div>
              </div>
              <DataTable :value="money" :loading="money_loading" responsiveLayout="scroll" dataKey="m.id">
                <Column field="m.server.name" header="Сервер" sortable>
                  <template #body="slotProps">
                    <div class="flex align-items-center">
                      <Avatar
                        v-if="slotProps.data.server.icon"
                        :image="`${$config.apiUrl + '/' + slotProps.data.server.icon}`"
                        shape="circle"
                      />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.data.server.name }}</span>
                    </div>
                  </template>
                </Column>
                <Column field="money" header="Количество" sortable>
                  <template #body="slotProps">
                    <InputNumber type="text" v-model="slotProps.data.money" mode="decimal" :minFractionDigits="2" :maxFractionDigits="2" />
                  </template>
                </Column>
                <Column :styles="{ width: '4rem' }">
                  <template #body="slotProps">
                    <Button @click="updateMoney(slotProps.data.server.id)" icon="pi pi-check" class="p-button-rounded mt-2" />
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
          <div class="col-12 md:col-6 p-4">
            <div class="flex justify-content-between align-items-center">
              <h4>Донат-группы</h4>
              <Button label="Выдать" class="p-button mr-2 mb-2" @click="showProductDialog()" />
            </div>
            <DataTable :value="udg" :loading="udg_loading" responsiveLayout="scroll" dataKey="m.id">
              <Column field="server" header="Сервер">
                <template #body="slotProps">
                  <div class="flex align-items-center">
                    <Avatar
                      v-if="slotProps.data.server.icon"
                      :image="`${$config.apiUrl + '/' + slotProps.data.server.icon}`"
                      shape="circle"
                    />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.data.server.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="group.name" header="Группа" sortable>
                <template #body="slotProps">
                  <div class="flex align-items-center">
                    <Avatar
                      v-if="slotProps.data.group.icon"
                      :image="`${$config.apiUrl + '/' + slotProps.data.group.icon}`"
                      shape="circle"
                    />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.data.group.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="expired" header="Истекает" sortable>
                <template #body="slotProps">
                  {{ slotProps.expired ? $moment(slotProps.expired).local().format('D MMMM YYYY, HH:mm') : 'Никогда' }}
                </template>
              </Column>
              <Column :styles="{ width: '4rem' }">
                <template #body="slotProps">
                  <Button @click="saveMoney(slotProps.data.server.id)" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" />
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="col-12 md:col-6 p-4">
            <div class="flex justify-content-between align-items-center">
              <h4>Донат-права</h4>
              <Button label="Выдать" class="p-button mr-2 mb-2" @click="showProductDialog()" />
            </div>
            <DataTable :value="udp" :loading="udp_loading" responsiveLayout="scroll" dataKey="m.id">
              <Column field="server" header="Сервер">
                <template #body="slotProps">
                  <div v-if="slotProps.server">
                    <div class="flex align-items-center">
                      <Avatar
                        v-if="slotProps.data.server.icon"
                        :image="`${$config.apiUrl + '/' + slotProps.data.server.icon}`"
                        shape="circle"
                      />
                      <Avatar v-else icon="pi pi-image" shape="circle" />
                      <span class="ml-2">{{ slotProps.data.server.name }}</span>
                    </div>
                  </div>
                  <div v-else>Web-сайт</div>
                </template>
              </Column>
              <Column field="permission.name" header="Право" sortable />
              <Column field="expired" header="Истекает" sortable>
                <template #body="slotProps">
                  {{ slotProps.expired ? $moment(slotProps.expired).local().format('D MMMM YYYY, HH:mm') : 'Никогда' }}
                </template>
              </Column>
              <Column :styles="{ width: '4rem' }">
                <template #body="slotProps">
                  <Button @click="saveMoney(slotProps.data.server.id)" icon="pi pi-trash" class="p-button-rounded p-button-danger mt-2" />
                </template>
              </Column>
            </DataTable>
          </div>
          <div class="col-12 p-4">
            <div class="flex align-items-center justify-content-between">
              <h4>Склад</h4>
              <Dropdown
                @change="warehouseFetch()"
                v-model="warehouse_server"
                :options="servers"
                optionLabel="name"
                appendTo="body"
                style="min-width: 150px"
              >
                <template #option="slotProps">
                  <div class="flex align-items-center">
                    <Avatar v-if="slotProps.option.icon" :image="`${$config.apiUrl + '/' + slotProps.option.icon}`" shape="circle" />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.option.name }} (#{{ slotProps.option.id }})</span>
                  </div>
                </template>
              </Dropdown>
            </div>
            <Button label="Выдать товар" class="p-button mr-2 mb-2" @click="showProductDialog()" />
            <Button label="Выдать кит" class="p-button mr-2 mb-2" @click="showKitDialog()" />
            <DataTable :value="warehouse" :loading="wh_loading" responsiveLayout="scroll" dataKey="id">
              <Column field="id" header="ID" :styles="{ width: '8rem' }" sortable></Column>
              <Column field="name" header="Название" sortable>
                <template #body="slotProps">
                  <div class="flex align-items-center">
                    <Avatar
                      v-if="slotProps.data.product.icon"
                      :image="`${$config.apiUrl + '/' + slotProps.data.product.icon}`"
                      shape="circle"
                    />
                    <Avatar v-else icon="pi pi-image" shape="circle" />
                    <span class="ml-2">{{ slotProps.data.product.name }}</span>
                  </div>
                </template>
              </Column>
              <Column field="price" header="Количество" sortable>
                <template #body="slotProps"> {{ slotProps.data.amount }} шт. </template>
              </Column>
              <Column field="categories" header="Категории" filterField="categories" :showFilterMatchModes="false">
                <template #body="slotProps">
                  <Tag
                    class="mr-2 mb-2"
                    v-for="category in slotProps.data.product.categories"
                    :key="category.id"
                    :value="category.name"
                  ></Tag>
                </template>
              </Column>
              <Column :styles="{ width: '4rem' }">
                <template #body="slotProps">
                  <Button @click="removeWHItem(slotProps.data.id)" icon="pi pi-trash" class="p-button-rounded p-button-warning mt-2" />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </TabPanel>
      <TabPanel header="История и сеансы">
        <div class="grid">
          <div class="col-12">
            <div class="p-fluid">
              <h4>История действий</h4>
            </div>
          </div>
          <div class="col-12">
            <div class="p-fluid">
              <h4>Сеансы авторизаций</h4>
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script>
export default {
  data() {
    return {
      servers: [],
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
      autocompleate: null,
      autocompleateFilterd: null,
      giveProductDialog: false,
      giveKitDialog: false,
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
      passwordForm: {
        password: null,
        password_confirm: null,
        close: true,
      },
      ban: null,
    }
  },

  async fetch() {
    this.roles = await this.$axios.get('/admin/roles').then((res) => res.data)
    this.servers = await this.$axios.get('/servers').then((res) => res.data)
    this.autocompleate = await this.$axios.get('/admin/roles/autocompleate').then((res) => res.data)
    await this.fetchUser()

    if (this.servers.length) {
      this.warehouse_server = this.servers[0]
      this.warehouseFetch()
      this.moneyFetch()
      this.udgFetch()
      this.udpFetch()
    }
  },

  methods: {
    async fetchUser() {
      this.user = await this.$axios.get('/users/' + this.$route.params.uuid).then((res) => res.data)
      this.rolesUser = this.roles.filter((role) => this.user.roles.find((ur) => ur.id == role.id)).map((r) => r.id)

      if (this.user.ban) {
        if (this.user.ban.expires) this.ban_model.expires = this.$moment(this.user.ban.expires).local().toDate()
        else this.ban_model.expires = null
        this.ban_model.reason = this.user.ban.reason
      } else {
        this.ban_model.expires = null
        this.ban_model.reason = null
      }
    },

    async warehouseFetch() {
      this.wh_loading = true
      this.warehouse = await this.$axios.get(`/store/warehouse/admin/${this.user.uuid}/${this.warehouse_server.id}`).then((res) => res.data)
      this.wh_loading = false
    },

    async moneyFetch() {
      this.money_loading = true
      this.money = await this.$axios.get(`/cabinet/money/admin/` + this.user.uuid).then((res) => res.data)
      this.money_loading = false
    },

    async udgFetch() {
      this.udg_loading = true
      this.udg = await this.$axios.get(`/donates/groups/admin/${this.user.uuid}`).then((res) => res.data)
      this.udg_loading = false
    },

    async udpFetch() {
      this.udp_loading = true
      this.udp = await this.$axios.get(`/donates/permissions/admin/${this.user.uuid}`).then((res) => res.data)
      this.udp_loading = false
    },

    async updateMoney(server_id) {
      this.money_loading = true
      await this.$axios.patch('/cabinet/money/admin', {
        type: 1,
        uuid: this.user.uuid,
        server: server_id,
        amount: this.money.find((srv) => srv.server.id == server_id).money,
      })
      await this.moneyFetch()
    },

    async updateReal() {
      await this.$axios.patch('/cabinet/money/admin', {
        type: 0,
        uuid: this.user.uuid,
        amount: this.user.real,
      })
      await this.fetchUser()
      this.$toast.add({
        severity: 'success',
        detail: 'Баланс обновлён',
        life: 3000,
      })
    },

    searchAutocompleate(event) {
      if (!event.query.trim().length) {
        this.autocompleateFilterd = this.autocompleate
      } else {
        this.autocompleateFilterd = [
          event.query.toLowerCase(),
          ...this.autocompleate.filter((perm) => {
            return perm.toLowerCase().includes(event.query.toLowerCase())
          }),
        ]

        if (this.autocompleateFilterd.length === 0) {
          this.autocompleateFilterd = [event.query.toLowerCase()]
        }
      }
    },

    async updateProfile() {
      try {
        await this.$axios.patch('/users/' + this.user.uuid, {
          username: this.user.username,
          email: this.user.email,
          superuser: this.user.superuser,
          activated: this.user.activated,
          roles: this.rolesUser,
          perms: this.user.perms,
        })
        await this.fetchUser()
        this.$toast.add({
          severity: 'success',
          detail: 'Профиль обновлён',
          life: 3000,
        })
      } catch {
        this.$toast.add({
          severity: 'error',
          detail: 'Некоректные данные, либо изменения могут справоцировать ошибку!',
          life: 3000,
        })
      }
    },

    async updatePassword() {
      try {
        await this.$axios.patch('/users/' + this.user.uuid + '/password', this.passwordForm)
        await this.fetchUser()
        this.$toast.add({
          severity: 'success',
          detail: 'Пароль пользователя обновлён',
          life: 3000,
        })
      } catch {
        this.$toast.add({
          severity: 'error',
          detail: 'Некоректные данные!',
          life: 3000,
        })
      }
    },

    async uploadSkin(event, type) {
      let formData = new FormData()
      formData.append('file', event.files[0])
      try {
        await this.$axios.patch(`/cabinet/skin/${type}/${this.user.uuid}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        this.$toast.add({
          severity: 'success',
          detail: 'Скин/плащ успешно обновлен',
          life: 3000,
        })
        await this.fetchUser()
      } catch {
        this.$toast.add({
          severity: 'error',
          detail: 'Файл не является скином/плащом',
          life: 3000,
        })
      }

      this.$refs.skinInput.clear()
      this.$refs.cloakInput.clear()
    },

    async deleteSkin(type) {
      await this.$axios.delete(`/cabinet/skin/${type}/${this.user.uuid}`)
      await this.fetchUser()
      this.$toast.add({
        severity: 'success',
        detail: 'Скин/плащ успешно удалён',
        life: 3000,
      })
    },

    async banCreate() {
      await this.$axios.post(`/bans/admin`, {
        user_uuid: this.user.uuid,
        expires: this.ban_model.expires,
        reason: this.ban_model.reason,
      })
      await this.fetchUser()
      this.$toast.add({
        severity: 'success',
        detail: 'Блокировка для пользователя обновлена',
        life: 3000,
      })
    },

    async deleteBan() {
      await this.$axios.delete(`/bans/admin/${this.user.uuid}`)
      await this.fetchUser()
      this.$toast.add({
        severity: 'success',
        detail: 'Блокировка для пользователя снята',
        life: 3000,
      })
    },

    async removeWHItem(id) {
      this.$confirm.require({
        message: `Данный процесс будет необратим!`,
        header: `Удаления товара со склада`,
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
          this.wh_loading = true
          try {
            await this.$axios.delete(`/store/warehouse/admin/` + id).then((res) => res.data)
          } catch {}
          await this.warehouseFetch()
          this.wh_loading = false
        },
      })
    },
    showProductDialog() {
      ;(this.whItem = {
        amount: null,
        server: null,
        kit: null,
        product: null,
      }),
        (this.giveProductDialog = true)
    },
    hideProductDialog() {
      this.giveProductDialog = false
    },
    showKitDialog() {
      ;(this.whItem = {
        amount: null,
        server: null,
        kit: null,
        product: null,
      }),
        (this.giveKitDialog = true)
    },
    hideKitDialog() {
      this.giveKitDialog = false
    },
    async searchProduct(event) {
      this.products = await this.$axios
        .get('/store/products', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    async searchKit(event) {
      this.kits = await this.$axios
        .get('/store/kits', {
          params: {
            search: event.query.trim(),
          },
        })
        .then((res) => res.data.data)
    },
    async giveProduct() {
      this.wh_loading = true
      try {
        await this.$axios
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
        await this.$axios
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
