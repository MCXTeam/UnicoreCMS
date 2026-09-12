export function sharedState<T>(key: string, create: () => T): T {
  const holder = globalThis as unknown as Record<symbol, T | undefined>;
  const slot = Symbol.for(key);

  if (!(slot in holder)) holder[slot] = create();

  return holder[slot] as T;
}
