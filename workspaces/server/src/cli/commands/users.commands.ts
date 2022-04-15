import { Command, CommandRunner } from "nest-commander";
import * as clc from "cli-color"
import { UserInput } from "src/admin/users/dto/user.input";
import { UsersService } from "src/admin/users/users.service";
import { validateOrReject } from "class-validator";

@Command({
  name: 'user-create',
  arguments: '<username> <email> <password> [superuser]',
  description: "Create a new user",
  argsDescription: {
    superuser: "Grant superuser permissions (boolean, default: false)",
  }
})
export class UsersCommandCreate implements CommandRunner {
  constructor(private usersService: UsersService) { }

  async run(inputs: string[], options?: Record<string, any>): Promise<void> {
    const input = new UserInput();

    input.username = inputs[0];
    input.email = inputs[1];
    input.password = inputs[2];
    input.superuser = inputs[3] && inputs[3] == "true" ? true : null;
    input.activated = true;

    await validateOrReject(input).catch(errors => {
      throw new Error('Validation failed! Errors: ' + errors)
    });

    if (await this.usersService.getByUsername(input.username))
      throw new Error("User already exists!")

    if (await this.usersService.getByEmail(input.email))
      throw new Error("User already exists!")

    const user = await this.usersService.create(input);

    console.log(clc.magenta("Account has been created"))
    console.log(`UUID: ${clc.magenta(user.uuid)}`)
    console.log(`Username: ${clc.magenta(user.username)}`)
    console.log(`Password: ${clc.magenta(user.password)}`)
  }
}