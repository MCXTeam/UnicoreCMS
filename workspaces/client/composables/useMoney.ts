export const useMoney = () => {
  const api = useApi()

  return {
    balance: () => api.get('/cabinet/money/me').then((res) => res.data),
    exchange: (payload: Record<string, unknown>) => api.post('cabinet/money/own/exchange', payload).then((res) => res.data),
    transfer: (payload: Record<string, unknown>) => api.post('cabinet/money/own/transfer', payload).then((res) => res.data),
    paymentMethods: () => api.get('/payment/methods').then((res) => res.data),
    bonuses: () => api.get('/payment/bonuses').then((res) => res.data),
    lastPayment: (params: Record<string, unknown> = {}) => api.get('/payment/last', { params }).then((res) => res.data),
    paymentLink: (method: string, amount: number) =>
      api.post(`/payment/methods/${method}/link`, { amount }).then((res) => res.data.link as string),
  }
}
