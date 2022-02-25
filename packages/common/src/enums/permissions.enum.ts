export enum Permission {
  // Dashboard
  AdminDashboard = "admin.dashboard",

  // User admin manipulations
  AdminUsersRead = "admin.users.read",
  AdminUsersCreate = "admin.users.create",
  AdminUsersUpdate = "admin.users.update",
  AdminUsersUpdateMany = "admin.users.update.many",
  AdminUsersDelete = "admin.users.delete",
  AdminUsersDeleteMany = "admin.users.delete.many",

  // Server admin manipulations
  AdminServersRead = "admin.servers.read",
  AdminServersCreate = "admin.servers.create",
  AdminServersUpdate = "admin.servers.update",
  AdminServersDelete = "admin.servers.delete",

  AdminPagesRead = "admin.pages.read",
  AdminPagesCreate = "admin.pages.create",
  AdminPagesUpdate = "admin.pages.update",
  AdminPagesDelete = "admin.pages.delete",

  AdminEmailRead = "admin.email.read",
  AdminEmailTest = "admin.email.test",
  AdminEmailUpdate = "admin.email.update",

  AdminWebhooksRead = "admin.webhooks.read",
  AdminWebhooksCreate = "admin.webhooks.create",
  AdminWebhooksUpdate = "admin.webhooks.update",
  AdminWebhooksDelete = "admin.webhooks.delete",
  AdminWebhooksDeleteMany = "admin.webhooks.delete.many",

  AdminRolesRead = "admin.roles.read",
  AdminRolesCreate = "admin.roles.create",
  AdminRolesUpdate = "admin.roles.update",
  AdminRolesDelete = "admin.roles.delete",

  EditorModsRead = "editor.mods.read",
  EditorModsCreate = "editor.mods.create",
  EditorModsUpdate = "editor.mods.update",
  EditorModsDelete = "editor.mods.delete",
  EditorModsDeleteMany = "editor.mods.delete.many",

  EditorNewsRead = "editor.news.read",
  EditorNewsCreate = "editor.news.create",
  EditorNewsUpdate = "editor.news.update",
  EditorNewsDelete = "editor.news.delete",
  EditorNewsDeleteMany = "editor.news.delete.many",

  EditorDonateGroupsRead = "editor.donate.groups.read",
  EditorDonateGroupsCreate = "editor.donate.groups.create",
  EditorDonateGroupsUpdate = "editor.donate.groups.update",
  EditorDonateGroupsDelete = "editor.donate.groups.delete",
  EditorDonateGroupsDeleteMany = "editor.donate.groups.delete.many",

  EditorDonatePermsRead = "editor.donate.permissions.read",
  EditorDonatePermsCreate = "editor.donate.permissions.create",
  EditorDonatePermsUpdate = "editor.donate.permissions.update",
  EditorDonatePermsDelete = "editor.donate.permissions.delete",
  EditorDonatePermsDeleteMany = "editor.donate.permissions.delete.many",

  EditorDonateKitsRead = "editor.donate.kits.read",
  EditorDonateKitsCreate = "editor.donate.kits.create",
  EditorDonateKitsUpdate = "editor.donate.kits.update",
  EditorDonateKitsDelete = "editor.donate.kits.delete",
  EditorDonateKitsDeleteMany = "editor.donate.kits.delete.many",

  EditorDonatePeriodsRead = "editor.donate.periods.read",
  EditorDonatePeriodsCreate = "editor.donate.periods.create",
  EditorDonatePeriodsUpdate = "editor.donate.periods.update",
  EditorDonatePeriodsDelete = "editor.donate.periods.delete",

  EditorStoreCategoryRead = "editor.store.category.read",
  EditorStoreCategoryCreate = "editor.store.category.create",
  EditorStoreCategoryUpdate = "editor.store.category.update",
  EditorStoreCategoryDelete = "editor.store.category.delete",
  EditorStoreCategoryDeleteMany = "editor.store.category.delete.many",

  EditorStoreProductsRead = "editor.store.products.read",
  EditorStoreProductsCreate = "editor.store.products.create",
  EditorStoreProductsUpdate = "editor.store.products.update",
  EditorStoreProductsUpdateMany = "editor.store.products.update.many",
  EditorStoreProductsDelete = "editor.store.products.delete",
  EditorStoreProductsDeleteMany = "editor.store.products.delete.many",

  EditorStoreKitsRead = "editor.store.kits.read",
  EditorStoreKitsCreate = "editor.store.kits.create",
  EditorStoreKitsUpdate = "editor.store.kits.update",
  EditorStoreKitsDelete = "editor.store.kits.delete",
  EditorStoreKitsDeleteMany = "editor.store.kits.delete.many",

  EditorCabinetGiftsRead = "editor.cabinet.gifts.read",
  EditorCabinetGiftsCreate = "editor.cabinet.gifts.create",
  EditorCabinetGiftsUpdate = "editor.cabinet.gifts.update",
  EditorCabinetGiftsDelete = "editor.cabinet.gifts.delete",
  EditorCabinetGiftsDeleteMany = "editor.cabinet.gifts.delete.many",

  UserCabinetSkin = "user.cabinet.skin",
  UserCabinetSkinHd = "user.cabinet.skin.hd",
  UserCabinetCloak = "user.cabinet.cloak",
  UserCabinetCloakHd = "user.cabinet.cloak.hd",
}
