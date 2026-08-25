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

export const ROLE_BADGE_DEFAULT_BACKGROUND = "#1f9d70";

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
