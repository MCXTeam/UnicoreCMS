import {
  isNotificationDateParam,
  isNotificationMoneyParam,
  type NotificationParams,
  type NotificationView,
} from 'unicore-common/notifications'

export const useNotificationText = () => {
  const { $t, $utils, $moment } = useNuxtApp() as any

  function value(name: string, raw: string | number): string {
    if (isNotificationMoneyParam(name)) return $utils.formatCurrency(name, Number(raw))
    if (isNotificationDateParam(name)) return $moment(raw).format('D MMMM YYYY, HH:mm')

    return String(raw)
  }

  function params(source: NotificationParams | null): Record<string, string> {
    const result: Record<string, string> = {}

    for (const [name, raw] of Object.entries(source || {})) result[name] = value(name, raw)

    return result
  }

  return {
    title: (item: NotificationView) => $t(item.titleKey, params(item.params)),
    body: (item: NotificationView) => (item.bodyKey ? $t(item.bodyKey, params(item.params)) : ''),
    when: (item: NotificationView) => $moment(item.created).fromNow(),
  }
}
