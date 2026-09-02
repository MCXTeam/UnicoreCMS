import clc from 'cli-color';
import { CommandDefinition, parseArgv } from './command';
import { CLI_HELP_FLAGS } from './constants';
import { stdout } from './stdout';

function usage(commands: CommandDefinition[]): void {
  stdout(clc.magenta('Commands:'));

  for (const command of commands) {
    const signature = [command.name, command.arguments].filter(Boolean).join(' ');

    stdout(`  ${clc.green(signature.padEnd(44))}${command.description}`);
  }
}

function commandHelp(command: CommandDefinition): void {
  stdout(clc.magenta([command.name, command.arguments].filter(Boolean).join(' ')));
  stdout(`  ${command.description}`);

  if (!command.options?.length) return;

  stdout(' ');
  stdout(clc.magenta('Options:'));

  for (const option of command.options) stdout(`  ${clc.green(option.flags.padEnd(28))}${option.description}`);
}

export async function runCommand(commands: CommandDefinition[], argv: string[]): Promise<void> {
  const [name, ...rest] = argv;

  if (!name || CLI_HELP_FLAGS.includes(name)) {
    usage(commands);

    return;
  }

  const command = commands.find((item) => item.name === name);

  if (!command) {
    stdout(clc.red(`Unknown command: ${name}`));
    usage(commands);

    throw new Error(`Unknown command: ${name}`);
  }

  if (rest.some((token) => CLI_HELP_FLAGS.includes(token))) {
    commandHelp(command);

    return;
  }

  const { args, options } = parseArgv(rest, command.options);

  await command.run(args, options);
}
