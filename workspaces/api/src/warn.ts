const seen = new Set<string>()

export const warnUnknown = (known: readonly string[], value: string, message: string): void => {
  if (known.includes(value) || seen.has(message)) return

  seen.add(message)
  console.warn(message)
}
