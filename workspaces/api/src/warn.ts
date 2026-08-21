export const warnUnknown = (known: readonly string[], value: string, message: string): void => {
  if (known.includes(value)) return

  console.warn(message)
}
