import { ForbiddenException } from '@nestjs/common';
import { isDenyPattern, denyTarget, isPlayerPermission, Permission, satisfiesPermission } from 'unicore-common';
import { grantedPermissions, matchPermission } from './guards/permisson.guard';

export async function assertGrantable(
  patterns: string[] = [],
  request: any,
  grant: Permission = 'panel.users.grant.panel',
): Promise<void> {
  if (request?.user?.superuser) return;

  const granted = await grantedPermissions(request);
  const panel = await matchPermission([grant], request);

  for (const pattern of patterns) {
    if (isDenyPattern(pattern)) continue;

    const target = denyTarget(pattern);

    if (!panel && !isPlayerPermission(target))
      throw new ForbiddenException(`Нельзя выдать право «${target}»: нет права выдавать права панели`);

    if (!satisfiesPermission(granted, target)) throw new ForbiddenException(`Нельзя выдать право «${target}»: его нет у вас`);
  }
}
