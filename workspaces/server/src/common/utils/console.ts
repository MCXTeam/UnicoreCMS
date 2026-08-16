export const stdout = (message = ''): void => {
  process.stdout.write(`${message}\n`);
};

export const stderr = (message = ''): void => {
  process.stderr.write(`${message}\n`);
};

export const formatError = (error: unknown): string => {
  if (error instanceof Error) return error.stack || `${error.name}: ${error.message}`;

  return String(error);
};
