export enum Permission {
  // Kernel
  KernelUnicoreProvider = "kernel.unicore.provider",
  KernelUnicoreConnect = "kernel.unicore.connect",

  // Dashboard
  AdminDashboard = "admin.dashboard",

  // User admin manipulations
  AdminUsersRead = "admin.users.read",
  AdminUsersCreate = "admin.users.create",
  AdminUsersUpdate = "admin.users.update",
  AdminUsersDelete = "admin.users.delete",
  AdminUsersDeleteMany = "admin.users.delete.many",

  // Server admin manipulations
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

  // AdminRolesRead = "admin.roles.read",
  // AdminRolesCreate = "admin.roles.create",
  // AdminRolesUpdate = "admin.roles.update",
  // AdminRolesDelete = "admin.roles.delete",

  EditorModsCreate = "editor.mods.create",
  EditorModsUpdate = "editor.mods.update",
  EditorModsDelete = "editor.mods.delete",
  EditorModsDeleteMany = "editor.mods.delete.many",

  EditorNewsCreate = "editor.news.create",
  EditorNewsUpdate = "editor.news.update",
  EditorNewsDelete = "editor.news.delete",
  EditorNewsDeleteMany = "editor.news.delete.many",

  EditorDonateRead = "editor.groups.read",

  EditorDonateGroupsCreate = "editor.donate.groups.create",
  EditorDonateGroupsUpdate = "editor.donate.groups.update",
  EditorDonateGroupsDelete = "editor.donate.groups.delete",
  EditorDonateGroupsDeleteMany = "editor.donate.groups.delete.many",

  EditorDonatePermsCreate = "editor.donate.permissions.create",
  EditorDonatePermsUpdate = "editor.donate.permissions.update",
  EditorDonatePermsDelete = "editor.donate.permissions.delete",
  EditorDonatePermsDeleteMany = "editor.donate.permissions.delete.many",

  EditorDonateKitsCreate = "editor.donate.kits.create",
  EditorDonateKitsUpdate = "editor.donate.kits.update",
  EditorDonateKitsDelete = "editor.donate.kits.delete",
  EditorDonateKitsDeleteMany = "editor.donate.kits.delete.many",

  EditorDonatePeriodsCreate = "editor.donate.periods.create",
  EditorDonatePeriodsUpdate = "editor.donate.periods.update",
  EditorDonatePeriodsDelete = "editor.donate.periods.delete",

  EditorStoreRead = "editor.store.read",

  EditorStoreCategoryCreate = "editor.store.category.create",
  EditorStoreCategoryUpdate = "editor.store.category.update",
  EditorStoreCategoryDelete = "editor.store.category.delete",
  EditorStoreCategoryDeleteMany = "editor.store.category.delete.many",

  EditorStoreProductsCreate = "editor.store.products.create",
  EditorStoreProductsUpdate = "editor.store.products.update",
  EditorStoreProductsUpdateMany = "editor.store.products.update.many",
  EditorStoreProductsDelete = "editor.store.products.delete",
  EditorStoreProductsDeleteMany = "editor.store.products.delete.many",
  EditorStoreProductsExport = "editor.store.products.export",
  EditorStoreProductsImport = "editor.store.products.import",

  EditorStoreKitsCreate = "editor.store.kits.create",
  EditorStoreKitsUpdate = "editor.store.kits.update",
  EditorStoreKitsDelete = "editor.store.kits.delete",
  EditorStoreKitsDeleteMany = "editor.store.kits.delete.many",

  EditorCabinetGiftsRead = "editor.cabinet.gifts.read",
  EditorCabinetGiftsCreate = "editor.cabinet.gifts.create",
  EditorCabinetGiftsUpdate = "editor.cabinet.gifts.update",
  EditorCabinetGiftsDelete = "editor.cabinet.gifts.delete",
  EditorCabinetGiftsDeleteMany = "editor.cabinet.gifts.delete.many",

  EditorVotesGiftsCreate = "editor.cabinet.votesgifts.create",
  EditorVotesGiftsUpdate = "editor.cabinet.votesgifts.update",
  EditorVotesGiftsDelete = "editor.cabinet.votesgifts.delete",

  EditorPaymentBonusesGiftsCreate = "editor.cabinet.paymentbonuses.create",
  EditorPaymentBonusesUpdate = "editor.cabinet.paymentbonuses.update",
  EditorPaymentBonusesDelete = "editor.cabinet.paymentbonuses.delete",

  UserCabinetSkin = "user.cabinet.skin",
  UserCabinetSkinHd = "user.cabinet.skin.hd",
  UserCabinetCloak = "user.cabinet.cloak",
  UserCabinetCloakHd = "user.cabinet.cloak.hd",
}
