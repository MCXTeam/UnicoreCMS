import { ValidateBy, ValidationArguments, ValidationOptions } from 'class-validator';
import { envConfig, IS_STRONG_PASSWORD, passwordContextOf, passwordIssue, passwordIssueCode } from 'unicore-common';

const contextOf = (args?: ValidationArguments) => passwordContextOf(args?.object, envConfig.sitename);

export function IsStrongPassword(validationOptions?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_STRONG_PASSWORD,
      validator: {
        validate: (value, args): boolean => passwordIssue(value, contextOf(args)) === null,
        defaultMessage: (args): string => passwordIssueCode(passwordIssue(args?.value, contextOf(args)) ?? 'short'),
      },
    },
    validationOptions,
  );
}
