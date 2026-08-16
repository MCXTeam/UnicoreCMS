import { runOnTransactionCommit } from 'typeorm-transactional';

export function runAfterCommit(callback: () => void) {
  try {
    runOnTransactionCommit(callback);
  } catch {
    callback();
  }
}
