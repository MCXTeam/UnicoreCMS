import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from 'src/common/constants';
import { PermissionArgs } from '../guards/permisson.guard';

export const Permissions = (args: PermissionArgs) => SetMetadata(PERMISSIONS_KEY, args);
