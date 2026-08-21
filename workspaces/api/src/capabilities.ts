export class Capabilities {
  private items = new Set<string>()

  replace(list: Iterable<string>): void {
    this.items = new Set(list)
  }

  add(name: string): void {
    this.items.add(name)
  }

  has(name: string): boolean {
    return this.items.has(name)
  }

  require(name: string): void {
    if (!this.items.has(name)) throw new Error(`Возможность «${name}» недоступна в этой версии UnicoreCMS`)
  }

  list(): string[] {
    return [...this.items].sort()
  }
}
