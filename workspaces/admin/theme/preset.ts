import { definePreset } from '@primeuix/styled'
import Aura from '@primevue/themes/aura'
import Lara from '@primevue/themes/lara'
import Material from '@primevue/themes/material'
import Nora from '@primevue/themes/nora'
import type { PrimeVuePreset } from 'unicore-api'
import { INTERFACE_PRESET } from 'unicore-ui/theme/preset'

type Preset = Record<string, unknown>

const PRESETS = { aura: Aura, lara: Lara, material: Material, nora: Nora } as unknown as Record<PrimeVuePreset, Preset>

export const presetFor = (name?: string, tokens?: Record<string, unknown>): Preset => {
  const base = definePreset(PRESETS[name as PrimeVuePreset] || PRESETS.aura, INTERFACE_PRESET) as Preset

  return tokens ? (definePreset(base, tokens) as Preset) : base
}
