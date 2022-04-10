import { applyDecorators, SetMetadata } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => applyDecorators(
    SkipThrottle(),
    SetMetadata(IS_PUBLIC_KEY, true)
);
