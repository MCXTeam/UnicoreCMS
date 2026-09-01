import { Exclude, Expose } from 'class-transformer';
import { displayRole, RoleBadgeEffect } from 'unicore-common';
import { Role } from '../entities/role.entity';

export interface RoleAppearanceRecord {
  id: string;
  name: string;
  priority: number;
  color: string | null;
  badge: boolean;
  badge_color: string | null;
  badge_background: string | null;
  badge_background_end: string | null;
  badge_image: string | null;
  badge_effect: RoleBadgeEffect;
}

@Exclude()
export class RoleAppearanceDto implements RoleAppearanceRecord {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  priority: number;

  @Expose()
  color: string;

  @Expose()
  badge: boolean;

  @Expose()
  badge_color: string;

  @Expose()
  badge_background: string;

  @Expose()
  badge_background_end: string;

  @Expose()
  badge_image: string;

  @Expose()
  badge_effect: RoleBadgeEffect;

  constructor(partial: RoleAppearanceRecord) {
    Object.assign(this, partial);
  }
}

export function roleAppearanceOf(role: Role): RoleAppearanceRecord {
  return {
    id: role.id,
    name: role.name,
    priority: role.priority ?? 0,
    color: role.color ?? null,
    badge: Boolean(role.badge),
    badge_color: role.badge_color ?? null,
    badge_background: role.badge_background ?? null,
    badge_background_end: role.badge_background_end ?? null,
    badge_image: role.badge_image ?? null,
    badge_effect: role.badge_effect ?? RoleBadgeEffect.None,
  };
}

export function roleAppearanceRecord(roles?: Role[] | null): RoleAppearanceRecord {
  const role = displayRole(roles as (Role & { priority?: number })[]);

  return role ? roleAppearanceOf(role) : null;
}

export function roleAppearance(roles?: Role[] | null): RoleAppearanceDto {
  const record = roleAppearanceRecord(roles);

  return record ? new RoleAppearanceDto(record) : null;
}
