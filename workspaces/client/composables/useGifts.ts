export const useGifts = () => {
  const api = useApi()
  const { config } = usePublicConfig()
  const { $t, $utils } = useNuxtApp() as any
  const code = useState<string>('gift-code', () => '')

  const describe = (item: any): string => {
    if (!item) return ''

    if (item.type == 'real') return $t('cabinet.referal_to_balance', { amount: $utils.formatCurrency('real', item.amount) })
    if (item.type == 'money')
      return $t('cabinet.gift_money', { amount: $utils.formatCurrency('ingame', item.amount), server: item.server.name })

    if (item.donate_group)
      return $t('cabinet.gift_donate', { name: item.donate_group.name, period: item.period.name, server: item.server.name })

    if (item.donate_permission)
      return item.donate_permission.type == 'web'
        ? $t('cabinet.gift_permission_web', { name: item.donate_permission.name, period: item.period.name })
        : $t('cabinet.gift_permission', { name: item.donate_permission.name, period: item.period.name, server: item.server.name })

    if (item.kit) return $t('cabinet.gift_kit', { name: item.kit.name, server: item.server.name })
    if (item.product) return $t('cabinet.gift_product', { name: item.product.name, amount: item.amount, server: item.server.name })

    return ''
  }

  return {
    describe,
    code,
    showCode: (value: string) => (code.value = value),
    codeEnabled: computed(() => !!config.value?.public_gifts_code_enabled),
    directEnabled: computed(() => !!config.value?.public_gifts_direct_enabled),
    purchase: (payload: Record<string, unknown>) => api.post('/cabinet/gifts/purchase', payload).then((res) => res.data),
    mine: () => api.get('/cabinet/gifts/my').then((res) => res.data),
  }
}
