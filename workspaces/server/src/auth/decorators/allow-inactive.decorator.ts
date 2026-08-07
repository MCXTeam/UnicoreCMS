import { SetMetadata } from '@nestjs/common';
import { ALLOW_INACTIVE_KEY } from 'src/common/constants';

export const AllowInactive = () => SetMetadata(ALLOW_INACTIVE_KEY, true);
