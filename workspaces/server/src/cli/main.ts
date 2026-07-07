import { ASCII_NAME } from '@common';
import { CommandFactory } from 'nest-commander';
import { CommandsModule } from './command.module';
import * as clc from 'cli-color';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeTransactionalContext } from 'typeorm-transactional';

const { version } = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'));

async function bootstrap() {
  console.log(clc.magenta(ASCII_NAME));
  console.log(' ');
  console.log(`\tVersion: ${version}, Starting CLI...`);
  console.log(' ');

  initializeTransactionalContext();

  await CommandFactory.run(CommandsModule);
}

bootstrap()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
