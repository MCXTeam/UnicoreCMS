import { BadRequestException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

export function assertBalanceAmount(...amounts: number[]): void {
  for (const amount of amounts) {
    if (!Number.isFinite(amount) || amount < 0) throw new BadRequestException();
  }
}

export async function debitUserBalance(
  repository: Repository<ObjectLiteral>,
  uuid: string,
  real: number,
  virtual = 0,
): Promise<void> {
  assertBalanceAmount(real, virtual);

  if (real === 0 && virtual === 0) return;

  const debit = await repository
    .createQueryBuilder()
    .update()
    .set({ real: () => 'real - :real', virtual: () => 'virtual - :virtual' })
    .where('uuid = :uuid AND real >= :real AND virtual >= :virtual', { uuid, real, virtual })
    .execute();

  if (!debit.affected) throw new BadRequestException();
}

export async function creditUserBalance(
  repository: Repository<ObjectLiteral>,
  uuid: string,
  real: number,
  virtual = 0,
): Promise<void> {
  assertBalanceAmount(real, virtual);

  if (real === 0 && virtual === 0) return;

  await repository
    .createQueryBuilder()
    .update()
    .set({ real: () => 'real + :real', virtual: () => 'virtual + :virtual' })
    .where('uuid = :uuid', { uuid, real, virtual })
    .execute();
}
