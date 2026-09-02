import { createInterface } from 'readline';
import { CLI_PROMPT_MASK } from './constants';

export function askHidden(question: string): Promise<string> {
  const input = process.stdin;
  const output = process.stdout;
  const rl = createInterface({ input, output, terminal: true });

  let visible = true;

  const write = output.write.bind(output);

  (output as NodeJS.WriteStream & { write: typeof write }).write = ((chunk: string, ...rest: unknown[]) =>
    visible ? write(chunk, ...(rest as [])) : write(CLI_PROMPT_MASK)) as typeof write;

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      (output as NodeJS.WriteStream & { write: typeof write }).write = write;
      output.write('\n');
      rl.close();
      resolve(answer);
    });

    visible = false;
  });
}
