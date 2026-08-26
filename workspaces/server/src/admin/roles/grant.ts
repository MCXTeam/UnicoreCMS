import { ForbiddenException } from '@nestjs/common';
import { isDenyPattern, denyTarget, isPlayerPermission, satisfiesPermission } from 'unicore-common';
import { grantedPermissions, matchPermission } from './guards/permisson.guard';

export async function assertGrantable(patterns: string[] = [], request: any): Promise<void> {
  if (request?.user?.superuser) return;

  const granted = await grantedPermissions(request);
  const panel = await matchPermission(['panel.users.grant.panel'], request);

  for (const pattern of patterns) {
    if (isDenyPattern(pattern)) continue;

    const target = denyTarget(pattern);

    if (!panel && !isPlayerPermission(target))
      throw new ForbiddenException(`Нельзя выдать право «${target}»: нет права выдавать права панели`);

    if (!satisfiesPermission(granted, target)) throw new ForbiddenException(`Нельзя выдать право «${target}»: его нет у вас`);
  }
}
