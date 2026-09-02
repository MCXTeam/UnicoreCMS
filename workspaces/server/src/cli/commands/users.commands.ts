import { Command, CommandRunner, InquirerService, Question, QuestionSet } from 'nest-commander';
import clc from 'cli-color';
import { UserInput } from 'src/admin/users/dto/user.input';
import { UsersService } from 'src/admin/users/users.service';
import { PasswordPolicyService } from 'src/auth/password/password-policy.service';
import { validateOrReject } from 'class-validator';
import { CLI_PASSWORD_QUESTIONS } from '../constants';
import { stdout } from '../stdout';

@QuestionSet({ name: CLI_PASSWORD_QUESTIONS })
export class UsersPasswordQuestions {
  @Question({ name: 'password', type: 'password', mask: '*', message: 'Password for the new user (they will be asked to change it on first sign-in):' })
  parsePassword(value: string): string {
    return value;
  }
}

@Command({
  name: 'user-create',
  arguments: '<username> <email> [superuser]',
  description: 'Create a new user',
  argsDescription: {
    superuser: 'Grant superuser permissions (boolean, default: false)',
  },
})
export class UsersCommandCreate extends CommandRunner {
  constructor(
    private usersService: UsersService,
    private passwordPolicy: PasswordPolicyService,
    private inquirer: InquirerService,
  ) {
    super();
  }

  async run(inputs: string[]): Promise<void> {
    const { password } = await this.inquirer.ask<{ password: string }>(CLI_PASSWORD_QUESTIONS, undefined);

    const input = new UserInput();

    input.username = inputs[0];
    input.email = inputs[1];
    input.password = password;
    input.superuser = inputs[2] && inputs[2] == 'true' ? true : null;
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
