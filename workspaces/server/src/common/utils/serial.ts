export class SerialQueue {
  private tail: Promise<unknown> = Promise.resolve();

  run<T>(task: () => Promise<T>): Promise<T> {
    const next = this.tail.then(task, task);

    this.tail = next.then(
      () => undefined,
      () => undefined,
    );

    return next;
  }
}
