export interface CustomCodeTarget {
  custom_css: string;
  custom_js: string;
}

export interface CustomCodeInput {
  custom_css?: string;
  custom_js?: string;
}

export function applyCustomCode(target: CustomCodeTarget, input: CustomCodeInput, allowed: boolean) {
  if (!allowed) return;

  target.custom_css = input.custom_css;
  target.custom_js = input.custom_js;
}
