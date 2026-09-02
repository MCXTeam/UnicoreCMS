import { ASCII_NAME } from '@common';
import { NestFactory } from '@nestjs/core';
import { CommandsModule } from './command.module';
import { CLI_COMMANDS } from './commands';
import { runCommand } from './runner';
import { stdout } from './stdout';
import clc from 'cli-color';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeTransactionalContext } from 'typeorm-transactional';

const { version } = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'));

async function bootstrap() {
  stdout(clc.magenta(ASCII_NAME));
  stdout(' ');
  stdout(`\tVersion: ${version}, Starting CLI...`);
  stdout(' ');

  initializeTransactionalContext();

  const app = await NestFactory.createApplicationContext(CommandsModule, { logger: ['error', 'warn'] });

  try {
    await runCommand(
      CLI_COMMANDS.map((command) => app.get(command)),
      process.argv.slice(2),
    );
  } finally {
    await app.close();
  }
}

bootstrap()
  .then(() => process.exit(0))
  .catch((err) => {
    stdout(String(err?.stack ?? err));
    process.exit(1);
  });
