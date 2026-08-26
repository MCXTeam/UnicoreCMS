import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';
import { IS_PLAYER_PERM, isPlayerPerm, PLAYER_PERMISSION_PREFIX } from 'unicore-common';

export function IsPlayerPerm(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_PLAYER_PERM,
      validator: {
        validate: (value): boolean => isPlayerPerm(value),
        defaultMessage: buildMessage((eachPrefix) => `${eachPrefix}$property must start with ${PLAYER_PERMISSION_PREFIX}`, validationOptions),
      },
    },
    validationOptions,
  );
}
