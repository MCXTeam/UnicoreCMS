export interface LicenseEntry {
  key: string
  id: string
  kind: 'module' | 'theme'
  productId: string | null
  selected: boolean
  activated: boolean
  allowed: boolean
  reason: string | null
  releaseId: string | null
  artifactDigest: string | null
  remaining: number
  expiresAt: number
}
export interface LicenseSnapshot {
  configured: boolean
  entries: LicenseEntry[]
}
export interface ExtensionAdmission {
  root?: string
  kind: 'module' | 'theme'
  id: string
  directory: string
  manifest?: { commercial?: { productId: string; protocol: number } }
}
export class LicenseHost {
  constructor(root: string)
  root: string
  entries: Map<string, LicenseEntry>
  assert(kind: 'module' | 'theme', id: string): void
  assertExtension(input: ExtensionAdmission): { licensed: boolean; artifact?: unknown }
  commercial(kind: 'module' | 'theme', id: string, manifest?: unknown, directory?: string): boolean
  requireLive(kind: 'module' | 'theme', id: string): Promise<void>
  operation(input: Record<string, unknown>): Promise<unknown>
  inspect(): Promise<LicenseSnapshot>
  refresh(): Promise<void>
  onBlocked(callback: (key: string, reason: string) => unknown): () => void
  close(): void
}
export function prepareLicenses(root: string): Promise<LicenseHost>
export function currentHost(root?: string): LicenseHost | undefined
export function assertExtension(input: ExtensionAdmission): { licensed: boolean; artifact?: unknown }
export function commercialExtension(input: ExtensionAdmission): boolean
export function assertModuleLicense(id: string): void
export function requireModuleLicense(id: string): Promise<void>
export function assertThemeLicense(id: string, releaseId: string, artifactDigest: string): void
export function moduleAllowed(id: string): boolean
export function loadModulePayload(id: string, target: NodeModule): unknown
export function startFrontend(options: {
  workspace: string
  dataRoot: string
  port: number
  host?: LicenseHost
}): Promise<false | { close(): Promise<void> }>
