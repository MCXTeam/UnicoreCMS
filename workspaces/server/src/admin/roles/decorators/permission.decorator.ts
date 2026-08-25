import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY, RUNTIME_PERMISSIONS_KEY } from 'src/common/constants';
import { PermissionArgs } from '../guards/permisson.guard';

export const Permissions = (args: PermissionArgs) => SetMetadata(PERMISSIONS_KEY, args);

export const RuntimePermissions = () => SetMetadata(RUNTIME_PERMISSIONS_KEY, true);
