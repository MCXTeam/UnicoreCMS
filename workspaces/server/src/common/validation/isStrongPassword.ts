import { ValidateBy, ValidationArguments, ValidationOptions } from 'class-validator';
import { envConfig, IS_STRONG_PASSWORD, PasswordContext, passwordIssue, passwordIssueCode } from 'unicore-common';

function contextOf(args?: ValidationArguments): PasswordContext {
  const object = (args?.object ?? {}) as Record<string, unknown>;

  return {
    username: typeof object.username === 'string' ? object.username : undefined,
    email: typeof object.email === 'string' ? object.email : undefined,
    sitename: envConfig.sitename,
  };
}

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
