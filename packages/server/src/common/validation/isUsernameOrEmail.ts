import { isUsername, IS_USERNAME_OR_EMAIL } from 'unicore-common';
import {
  ValidateBy,
  ValidationOptions,
  buildMessage,
  isEmail,
} from 'class-validator';
import ValidatorJS from 'validator';

/**
 * Проверяет, является ли строка логином или Email'ом.
 * Если заданное значение не является строкой, то оно возвращает значение false.
 */
export function IsUsernameOrEmail(
  options?: ValidatorJS.IsEmailOptions,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_USERNAME_OR_EMAIL,
      constraints: [options],
      validator: {
        validate: (value, args): boolean =>
          isUsername(value) || isEmail(value, args.constraints[0]),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be an username or email`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
