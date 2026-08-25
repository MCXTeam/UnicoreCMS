import { Exclude, Expose } from 'class-transformer';
import { displayRole, RoleBadgeEffect } from 'unicore-common';
import { Role } from '../entities/role.entity';

@Exclude()
export class RoleAppearanceDto {
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

  constructor(partial: Partial<Role>) {
    Object.assign(this, partial);
  }
}

export function roleAppearance(roles?: Role[] | null): RoleAppearanceDto {
  const role = displayRole(roles as (Role & { priority?: number })[]);

  return role ? new RoleAppearanceDto(role) : null;
}
