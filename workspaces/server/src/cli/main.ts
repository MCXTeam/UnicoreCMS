import { ASCII_NAME } from '@common';
import { CommandFactory } from 'nest-commander';
import { CommandsModule } from './command.module';
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

  await CommandFactory.run(CommandsModule, { logger: ['error', 'warn'] });
}

bootstrap()
  .then(() => process.exit(0))
  .catch((err) => {
    stdout(String(err?.stack ?? err));
    process.exit(1);
  });
