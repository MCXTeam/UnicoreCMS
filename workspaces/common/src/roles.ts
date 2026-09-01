export enum RoleBadgeEffect {
  None = 0,
  Gradient = 1,
  AnimatedGradient = 2,
  Neon = 3,
}

export const ROLE_BADGE_EFFECTS: RoleBadgeEffect[] = [
  RoleBadgeEffect.None,
  RoleBadgeEffect.Gradient,
  RoleBadgeEffect.AnimatedGradient,
  RoleBadgeEffect.Neon,
];

export const ROLE_BADGE_EFFECT_LABELS: Record<RoleBadgeEffect, string> = {
  [RoleBadgeEffect.None]: "admin.role_effect_none",
  [RoleBadgeEffect.Gradient]: "admin.role_effect_gradient",
  [RoleBadgeEffect.AnimatedGradient]: "admin.role_effect_animated",
  [RoleBadgeEffect.Neon]: "admin.role_effect_neon",
};

export const ROLE_COLOR_MAX_LENGTH = 32;

export const ROLE_BADGE_DEFAULT_COLOR = "#ffffff";

export const ROLE_BADGE_DARK_COLOR = "#111111";

export const ROLE_BADGE_DEFAULT_BACKGROUND = "#1f9d70";

const HEX_COLOR_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const SRGB_LINEAR_THRESHOLD = 0.04045;

const CONTRAST_LUMINANCE_THRESHOLD = 0.4;

export interface RoleAppearance {
  name?: string;
  color?: string | null;
  badge?: boolean;
  badge_color?: string | null;
  badge_background?: string | null;
  badge_background_end?: string | null;
  badge_image?: string | null;
  badge_effect?: RoleBadgeEffect | null;
}

export const ROLE_BADGE_CLASS = "role-badge";

export function roleBadgeClass(role?: RoleAppearance | null): string[] {
  const classes = [ROLE_BADGE_CLASS];

  if (role?.badge_effect === RoleBadgeEffect.AnimatedGradient)
    classes.push(`${ROLE_BADGE_CLASS}--animated`);
  if (role?.badge_effect === RoleBadgeEffect.Neon)
    classes.push(`${ROLE_BADGE_CLASS}--neon`);

  return classes;
}

export function roleNameStyle(
  role?: RoleAppearance | null,
): Record<string, string> {
  return role?.color ? { color: role.color } : {};
}

export function roleContrastColor(background?: string | null): string {
  if (!background || !HEX_COLOR_PATTERN.test(background))
    return ROLE_BADGE_DEFAULT_COLOR;

  const digits =
    background.length === 4
      ? [...background.slice(1)].map((char) => char + char).join("")
      : background.slice(1);
  const [red, green, blue] = [0, 2, 4].map((offset) => {
    const channel = parseInt(digits.slice(offset, offset + 2), 16) / 255;

    return channel <= SRGB_LINEAR_THRESHOLD
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;

  return luminance > CONTRAST_LUMINANCE_THRESHOLD
    ? ROLE_BADGE_DARK_COLOR
    : ROLE_BADGE_DEFAULT_COLOR;
}

export function staffRoleAppearance(role: RoleAppearance): RoleAppearance {
  return { ...role, badge: true };
}

export function staffGroupAppearance(
  name: string,
  color?: string | null,
): RoleAppearance {
  return {
    name,
    color: color ?? null,
    badge: true,
    badge_color: roleContrastColor(color),
    badge_background: color ?? null,
    badge_background_end: null,
    badge_image: null,
    badge_effect: RoleBadgeEffect.None,
  };
}

export function roleBadgeStyle(
  role?: RoleAppearance | null,
  imageBaseUrl = "",
): Record<string, string> {
  if (!role) return {};

  const color = role.badge_color || ROLE_BADGE_DEFAULT_COLOR;
  const background = role.badge_background || ROLE_BADGE_DEFAULT_BACKGROUND;
  const end = role.badge_background_end || background;
  const style: Record<string, string> = { color, background };

  if (
    role.badge_effect === RoleBadgeEffect.Gradient ||
    role.badge_effect === RoleBadgeEffect.AnimatedGradient
  )
    style.background = `linear-gradient(90deg, ${background}, ${end}, ${background})`;

  if (role.badge_effect === RoleBadgeEffect.Neon) {
    style.boxShadow = `0 0 0.35rem ${background}, 0 0 1rem ${background}`;
    style.textShadow = `0 0 0.4rem ${color}`;
  }

  if (role.badge_image)
    style.backgroundImage = `url('${imageBaseUrl}${role.badge_image}')`;

  return style;
}

export function displayRole<T extends RoleAppearance & { priority?: number }>(
  roles?: T[] | null,
): T | null {
  if (!Array.isArray(roles) || !roles.length) return null;

  return roles.reduce((top, role) =>
    (role.priority ?? 0) > (top.priority ?? 0) ? role : top,
  );
}
