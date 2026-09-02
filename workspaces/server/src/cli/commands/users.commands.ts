import { Injectable } from '@nestjs/common';
import clc from 'cli-color';
import { UserInput } from 'src/admin/users/dto/user.input';
import { UsersService } from 'src/admin/users/users.service';
import { PasswordPolicyService } from 'src/auth/password/password-policy.service';
import { validateOrReject } from 'class-validator';
import { CommandDefinition } from '../command';
import { CLI_PASSWORD_PROMPT } from '../constants';
import { askHidden } from '../prompt';
import { stdout } from '../stdout';

@Injectable()
export class UsersCommandCreate implements CommandDefinition {
  readonly name = 'user-create';
  readonly description = 'Create a new user, pass true as the third argument for a superuser';
  readonly arguments = '<username> <email> [superuser]';

  constructor(private usersService: UsersService, private passwordPolicy: PasswordPolicyService) {}

  async run(args: string[]): Promise<void> {
    const input = new UserInput();

    input.username = args[0];
    input.email = args[1];
    input.password = await askHidden(CLI_PASSWORD_PROMPT);
    input.superuser = args[2] === 'true' ? true : null;
    input.activated = true;

    await validateOrReject(input).catch((errors) => {
      throw new Error('Validation failed! Errors: ' + errors);
    });

    if (await this.usersService.getByUsername(input.username)) throw new Error('User already exists!');

    if (await this.usersService.getByEmail(input.email)) throw new Error('User already exists!');

    await this.passwordPolicy.assert(input.password, { username: input.username, email: input.email });

    const user = await this.usersService.create(input);

    stdout(clc.magenta('Account has been created'));
    stdout(`UUID: ${clc.magenta(user.uuid)}`);
    stdout(`Username: ${clc.magenta(user.username)}`);
  }
}
