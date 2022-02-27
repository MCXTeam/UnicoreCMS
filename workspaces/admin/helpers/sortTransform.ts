export function sortTransform(order: number, field: string) {
  let order_ = 'ASC'
  if (order === -1) order_ = 'DESC'
  return [field, order_].join(':')
}
