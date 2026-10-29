const severityPalettes = {
  success: 'green',
  info: 'sky',
  warn: 'orange',
  help: 'purple',
  danger: 'red',
}
const readableSeverity = (palette: string) => ({
  background: `{${palette}.700}`,
  hoverBackground: `{${palette}.800}`,
  activeBackground: `{${palette}.900}`,
  borderColor: `{${palette}.700}`,
  hoverBorderColor: `{${palette}.800}`,
  activeBorderColor: `{${palette}.900}`,
  color: '#ffffff',
  hoverColor: '#ffffff',
  activeColor: '#ffffff',
})
const severityText = Object.fromEntries(
  Object.entries(severityPalettes).map(([severity, palette]) => [
    severity,
    { color: `{${palette}.700}` },
  ]),
)

export const INTERFACE_PRESET = {
  primitive: {
    borderRadius: {
      none: '0',
      xs: 'var(--ui-space-1)',
      sm: 'var(--ui-space-2)',
      md: 'var(--ui-radius-control)',
      lg: 'var(--ui-radius-card)',
      xl: 'var(--ui-radius-dialog)',
    },
  },
  semantic: {
    transitionDuration: '0.2s',
    formField: {
      paddingX: 'var(--ui-space-3)',
      paddingY: 'var(--ui-space-2)',
      borderRadius: '{border.radius.md}',
      sm: {
        fontSize: '14px',
        paddingX: 'var(--ui-space-2)',
        paddingY: 'var(--ui-space-1)',
      },
      lg: {
        fontSize: '16px',
        paddingX: 'var(--ui-space-4)',
        paddingY: 'var(--ui-space-3)',
      },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: Object.fromEntries(
            Object.entries(severityPalettes).map(([severity, palette]) => [
              severity,
              readableSeverity(palette),
            ]),
          ),
          text: severityText,
          outlined: severityText,
        },
      },
      root: {
        gap: 'var(--ui-space-2)',
        iconOnlyWidth: 'var(--ui-control)',
        sm: { iconOnlyWidth: 'var(--ui-control-sm)' },
        lg: { iconOnlyWidth: 'var(--ui-control-lg)' },
      },
    },
    card: {
      root: { borderRadius: 'var(--ui-radius-card)' },
      body: { padding: 'var(--ui-card-padding)', gap: 'var(--ui-space-4)' },
      title: { fontSize: 'var(--ui-title-section)', fontWeight: '700' },
    },
    dialog: {
      root: { borderRadius: 'var(--ui-radius-dialog)' },
      header: { padding: 'var(--ui-card-padding)', gap: 'var(--ui-space-4)' },
      title: { fontSize: 'var(--ui-title-section)', fontWeight: '700' },
      content: { padding: '0 var(--ui-card-padding) var(--ui-card-padding)' },
      footer: {
        padding: '0 var(--ui-card-padding) var(--ui-card-padding)',
        gap: 'var(--ui-space-2)',
      },
    },
    toolbar: {
      root: {
        padding: 'var(--ui-space-4)',
        gap: 'var(--ui-space-4)',
        borderRadius: 'var(--ui-radius-card)',
      },
    },
  },
}
