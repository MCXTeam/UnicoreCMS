import { SetMetadata } from '@nestjs/common';
import { ALLOW_PASSWORD_PENDING_KEY } from 'src/common/constants';

export const AllowPasswordPending = () => SetMetadata(ALLOW_PASSWORD_PENDING_KEY, true);
