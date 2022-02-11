import { ValidateBy, ValidationOptions, buildMessage } from 'class-validator';
import { IS_USERNAME, isUsername } from 'unicore-common';

/**
 * Проверяет, является ли строка логином.
 * Если заданное значение не является строкой, то оно возвращает значение false.
 */
export function IsUsername(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_USERNAME,
      validator: {
        validate: (value): boolean => isUsername(value),
        defaultMessage: buildMessage(
          (eachPrefix) => `${eachPrefix}$property must be an username`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
