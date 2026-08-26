import bcrypt from 'bcrypt';
import { envConfig } from 'unicore-common';
import { PASSWORD_ALGORITHM_BCRYPT, PASSWORD_BCRYPT_PREFIXES } from '@common';
import { PasswordAlgorithm } from './password-algorithm.interface';

const parseCost = (phc: string): number => Number(phc.split('$')[2]);

export const bcryptAlgorithm: PasswordAlgorithm = {
  id: PASSWORD_ALGORITHM_BCRYPT,

  matches: (phc) => PASSWORD_BCRYPT_PREFIXES.some((prefix) => phc.startsWith(prefix)),

  hash: (plain) => bcrypt.hash(plain, envConfig.passwordBcryptCost),

  verify: async (plain, phc) => {
    try {
      return await bcrypt.compare(plain, phc);
    } catch {
      return false;
    }
  },

  outdated: (phc) => parseCost(phc) < envConfig.passwordBcryptCost,
};
