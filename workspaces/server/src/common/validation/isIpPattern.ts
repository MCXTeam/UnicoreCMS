import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';
import { IS_IP_PATTERN, isIpPattern } from '@common';

export function IsIpPattern(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_IP_PATTERN,
      validator: {
        validate: (value): boolean => typeof value === 'string' && isIpPattern(value),
        defaultMessage: buildMessage((eachPrefix) => `${eachPrefix}$property must be an IP, CIDR or "*"`, validationOptions),
      },
    },
    validationOptions,
  );
}
