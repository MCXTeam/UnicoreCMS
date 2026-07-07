import _ from 'lodash'

_.mixin({
  deepKeys(obj: any) {
    let keys: string[] = []
    for (const key in obj) {
      keys.push(key)
      if (typeof obj[key] === 'object') {
        const subkeys = (_ as any).deepKeys(obj[key])
        keys = keys.concat(subkeys.map((subkey: string) => key + '.' + subkey))
      }
    }
    return keys
  },
})

export default defineNuxtPlugin(() => {
  return { provide: { _ } }
})
