#!/usr/bin/env node

import { ASCII_NAME } from '@common';
import { CommandFactory } from 'nest-commander';
import { CommandsModule } from './command.module';
import * as clc from "cli-color"
import { readFileSync } from 'fs';
import { resolve } from 'path';

const { version } = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'))

async function bootstrap() {
  console.log(clc.magenta(ASCII_NAME));
  console.log(" ");
  console.log(`\tVersion: ${version}, Starting CLI...`);
  console.log(" ");
  
  await CommandFactory.run(CommandsModule);
}

bootstrap();