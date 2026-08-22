import { formatError, stderr } from '@common';
import { runAlign, schemaStatus } from './runner';

const commands: Record<string, () => Promise<void>> = {
  status: schemaStatus,
  align: runAlign,
};

const command = commands[process.argv[2]];

if (!command) {
  stderr(`Неизвестная команда. Доступны: ${Object.keys(commands).join(', ')}`);
  process.exit(1);
}

command().catch((error) => {
  stderr(formatError(error));
  process.exit(1);
});
