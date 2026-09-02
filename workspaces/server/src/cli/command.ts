import { CLI_OPTION_FLAG_PATTERN, CLI_OPTION_VALUE_PATTERN } from './constants';

export interface CommandOption {
  flags: string;
  description: string;
}

export interface CommandDefinition {
  readonly name: string;
  readonly description: string;
  readonly arguments?: string;
  readonly options?: CommandOption[];
  run(args: string[], options: Record<string, string | boolean>): Promise<void>;
}

export interface ParsedOption {
  short?: string;
  long: string;
  takesValue: boolean;
}

export function parseFlags(flags: string): ParsedOption {
  const names = flags.match(CLI_OPTION_FLAG_PATTERN) ?? [];

  return {
    short: names.find((name) => !name.startsWith('--'))?.replace(/^-/, ''),
    long: (names.find((name) => name.startsWith('--')) ?? '').replace(/^--/, ''),
    takesValue: CLI_OPTION_VALUE_PATTERN.test(flags),
  };
}

export function parseArgv(argv: string[], options: CommandOption[] = []): { args: string[]; options: Record<string, string | boolean> } {
  const known = options.map((option) => parseFlags(option.flags));
  const args: string[] = [];
  const parsed: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];

    if (!token.startsWith('-')) {
      args.push(token);
      continue;
    }

    const [flag, inline] = token.replace(/^--?/, '').split('=');
    const option = known.find((item) => item.long === flag || item.short === flag);

    if (!option) continue;

    if (!option.takesValue) {
      parsed[option.long] = true;
      continue;
    }

    if (inline !== undefined) {
      parsed[option.long] = inline;
      continue;
    }

    const next = argv[index + 1];

    if (next !== undefined && !next.startsWith('-')) {
      parsed[option.long] = next;
      index++;
    }
  }

  return { args, options: parsed };
}
