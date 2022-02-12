export enum Permission {
  // Dashboard
  AdminDashboard = "admin.dashboard",

  // Config
  AdminConfigRead = "admin.config.read",
  AdminConfigUpdate = "admin.config.update",

  // User admin manipulations
  AdminUserRead = "admin.user.read",
  AdminUserCreate = "admin.user.create",
  AdminUserUpdate = "admin.user.update",
  AdminUserDelete = "admin.user.delete",
  AdminUserDeleteMany = "admin.user.delete.many",
  //AdminUserPermissionsRead = 'admin.user.permissions.read',
  AdminUserPermissionsUpdate = "admin.user.permissions.update",
  AdminUserPermissionsDelete = "admin.user.permissions.delete",
  //AdminUserRolesRead = 'admin.user.roles.read',
  AdminUserRolesUpdate = "admin.user.roles.update",
  AdminUserRolesDelete = "admin.user.roles.delete",

  // Server admin manipulations
  AdminServerCreate = "admin.server.create",
  AdminServerUpdateServer = "admin.server.update.%server%",
  AdminServerDelete = "admin.server.delete",
  AdminServerDeleteMany = "admin.server.delete.many",
  AdminServerReadQuery = "admin.server.query.read",
  AdminServerUpdateQuery = "admin.server.query.update",

  // Log admin
  AdminLog = "admin.log",

  // Admin Permissions & roles
  //AdminRolesRead = 'admin.rolse.read',
  AdminRolesCreate = "admin.rolse.create",
  AdminRolesUpdate = "admin.rolse.update",
  AdminRolesDelete = "admin.rolse.delete",
  AdminRolesDeleteMany = "admin.rolse.delete.many",
  //AdminRolesPermissionsRead = 'admin.rolse.permissions.read',
  AdminRolesPermissionsUpdate = "admin.rolse.permissions.update",
  AdminRolesPermissionsDelete = "admin.rolse.permissions.delete",

  EditorNewsCreate = "editor.news.create",
  EditorNewsUpdate = "editor.news.update",
  EditorNewsDelete = "editor.news.delete",
  EditorNewsDeleteMany = "editor.news.delete.many",

  EditorStoreItemCreateServer = "editor.store.item.create.%server%",
  EditorStoreItemUpdateServer = "editor.store.item.update.%server%",
  EditorStoreItemUpdateManyServer = "editor.store.item.update.many.%server%",
  EditorStoreItemDeleteServer = "editor.store.item.delete.%server%",
  EditorStoreItemDeleteManyServer = "editor.store.item.delete.many.%server%",

  EditorStoreCategoryCreateServer = "editor.store.category.create.%server%",
  EditorStoreCategoryUpdateServer = "editor.store.category.update.%server%",
  EditorStoreCategoryUpdateManyServer = "editor.store.category.update.many.%server%",
  EditorStoreCategoryDeleteServer = "editor.store.category.delete.%server%",
  EditorStoreCategoryDeleteManyServer = "editor.store.category.delete.many.%server%",
}
