import { Algorithm, hash, verify } from '@node-rs/argon2';
import { envConfig } from 'unicore-common';
import { PASSWORD_ALGORITHM_ARGON2ID, PASSWORD_ARGON2_PREFIXES } from '@common';
import { PasswordAlgorithm } from './password-algorithm.interface';

const options = () => ({
  algorithm: Algorithm.Argon2id,
  memoryCost: envConfig.passwordArgon2Memory,
  timeCost: envConfig.passwordArgon2Time,
  parallelism: envConfig.passwordArgon2Parallelism,
});

const parseParams = (phc: string): Record<string, number> => {
  const params = phc.split('$')[3] ?? '';

  return Object.fromEntries(
    params
      .split(',')
      .map((pair) => pair.split('='))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, Number(value)]),
  );
};

export const argon2Algorithm: PasswordAlgorithm = {
  id: PASSWORD_ALGORITHM_ARGON2ID,

  matches: (phc) => PASSWORD_ARGON2_PREFIXES.some((prefix) => phc.startsWith(prefix)),

  hash: (plain) => hash(plain, options()),

  verify: async (plain, phc) => {
    try {
      return await verify(phc, plain, options());
    } catch {
      return false;
    }
  },

  outdated: (phc) => {
    if (!phc.startsWith(PASSWORD_ARGON2_PREFIXES[0])) return true;

    const { m, t, p } = parseParams(phc);

    return m !== envConfig.passwordArgon2Memory || t !== envConfig.passwordArgon2Time || p !== envConfig.passwordArgon2Parallelism;
  },
};
