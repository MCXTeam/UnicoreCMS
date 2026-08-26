import { moduleActive } from 'unicore-api/client'

const MODULE_PATH = /^\/mod\/([a-z][a-z0-9_]{2,31})(?:\/|$)/

export default defineNuxtRouteMiddleware((to) => {
  const match = MODULE_PATH.exec(to.path)

  if (match && !moduleActive(match[1]))
    return abortNavigation(createError({ statusCode: 404, statusMessage: 'Модуль выключен', fatal: true }))
})
