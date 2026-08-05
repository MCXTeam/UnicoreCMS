import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';
import { IS_DONATE_WEB_PERM, isDonateWebPerm, DONATE_WEB_PERM_PREFIXES } from 'unicore-common';

export function IsDonateWebPerm(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_DONATE_WEB_PERM,
      validator: {
        validate: (value): boolean => isDonateWebPerm(value),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must start with ${DONATE_WEB_PERM_PREFIXES.join(' or ')}`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
