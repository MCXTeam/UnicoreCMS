import { SetMetadata } from '@nestjs/common';
import { THROTTLE_KEY, THROTTLE_SKIP_KEY } from '../constants';

export interface ThrottleOptions {
  ttl: number;
  limit: number;
}

export const Throttle = (options: ThrottleOptions) => SetMetadata(THROTTLE_KEY, options);

export const SkipThrottle = () => SetMetadata(THROTTLE_SKIP_KEY, true);
