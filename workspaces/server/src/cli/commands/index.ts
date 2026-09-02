import { Type } from '@nestjs/common';
import { CommandDefinition } from '../command';
import { CryptoRewrapCommand } from './crypto.commands';
import { PermissionsCheckCommand } from './permissions.commands';
import { SeedCommand } from './seed.command';
import { UsersCommandCreate } from './users.commands';

export const CLI_COMMANDS: Type<CommandDefinition>[] = [
  UsersCommandCreate,
  SeedCommand,
  CryptoRewrapCommand,
  PermissionsCheckCommand,
];

export { CryptoRewrapCommand, PermissionsCheckCommand, SeedCommand, UsersCommandCreate };
