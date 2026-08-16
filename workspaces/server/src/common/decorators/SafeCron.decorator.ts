import { Logger } from '@nestjs/common';
import { Cron, CronOptions } from '@nestjs/schedule';
import { formatError } from '../utils/console';

const logger = new Logger('Cron');

export function SafeCron(expression: string, task: string, options?: CronOptions): MethodDecorator {
  return (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      try {
        return await original.apply(this, args);
      } catch (error) {
        logger.error(`Задача "${task}" завершилась ошибкой: ${formatError(error)}`);
      }
    };

    return Cron(expression, options)(target, propertyKey, descriptor);
  };
}
