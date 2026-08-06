export const stdout = (message = ''): void => {
  process.stdout.write(`${message}\n`);
};
