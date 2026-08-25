import { definePreset } from '@primeuix/styled'
import Aura from '@primevue/themes/aura'
import Lara from '@primevue/themes/lara'
import Material from '@primevue/themes/material'
import Nora from '@primevue/themes/nora'
import type { PrimeVuePreset } from 'unicore-api'

type Preset = Record<string, unknown>

const PRESETS = { aura: Aura, lara: Lara, material: Material, nora: Nora } as unknown as Record<PrimeVuePreset, Preset>

const BRAND = {
  50: '#f7ebfa',
  100: '#eccdf3',
  200: '#dcabe8',
  300: '#ca86dc',
  400: '#ba68c8',
  500: '#9c27b0',
  600: '#8a239c',
  700: '#761e86',
  800: '#5f1a6d',
  900: '#471351',
  950: '#2c0c33',
}

const UNICORE_TOKENS = {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '8px',
      sm: '10px',
      md: '12px',
      lg: '14px',
      xl: '18px',
    },
  },
  semantic: {
    primary: BRAND,
    formField: {
      paddingX: '0.85rem',
      paddingY: '0.6rem',
      borderRadius: '{border.radius.md}',
      focusRing: {
        width: '2px',
        style: 'solid',
        color: '{primary.color}',
        offset: '2px',
      },
    },
    colorScheme: {
      light: {
        formField: {
          background: '#f3f5f8',
          disabledBackground: '#eceff3',
          filledBackground: '#f3f5f8',
          borderColor: 'rgba(0, 0, 0, 0.09)',
          hoverBorderColor: 'rgba(156, 39, 176, 0.45)',
          focusBorderColor: '{primary.color}',
          color: 'rgba(0, 0, 0, 0.85)',
          placeholderColor: 'rgba(0, 0, 0, 0.45)',
        },
        content: {
          background: '#ffffff',
          hoverBackground: 'rgba(0, 0, 0, 0.04)',
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
        overlay: {
          select: { background: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.08)' },
          popover: { background: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.08)' },
          modal: { background: '#ffffff', borderColor: 'rgba(0, 0, 0, 0.08)' },
        },
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },
        formField: {
          background: 'rgba(255, 255, 255, 0.05)',
          disabledBackground: 'rgba(255, 255, 255, 0.03)',
          filledBackground: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.09)',
          hoverBorderColor: 'rgba(186, 104, 200, 0.5)',
          focusBorderColor: '{primary.400}',
          color: 'rgba(255, 255, 255, 0.9)',
          placeholderColor: 'rgba(255, 255, 255, 0.5)',
        },
        content: {
          background: '#1e2023',
          hoverBackground: 'rgba(255, 255, 255, 0.06)',
          borderColor: 'rgba(255, 255, 255, 0.09)',
        },
        overlay: {
          select: { background: '#1e2023', borderColor: 'rgba(255, 255, 255, 0.09)' },
          popover: { background: '#1e2023', borderColor: 'rgba(255, 255, 255, 0.09)' },
          modal: { background: '#1e2023', borderColor: 'rgba(255, 255, 255, 0.09)' },
        },
      },
    },
  },
}

export const presetFor = (name?: string, tokens?: Record<string, unknown>): Preset => {
  const base = definePreset(PRESETS[name as PrimeVuePreset] || PRESETS.aura, UNICORE_TOKENS) as Preset

  return tokens ? (definePreset(base, tokens) as Preset) : base
}
