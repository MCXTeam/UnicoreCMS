import { SetMetadata } from '@nestjs/common';
import { PermissionArgs } from '../guards/permisson.guard';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (args: PermissionArgs) => SetMetadata(PERMISSIONS_KEY, args);
