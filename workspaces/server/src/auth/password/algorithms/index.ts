import { argon2Algorithm } from './argon2.algorithm';
import { bcryptAlgorithm } from './bcrypt.algorithm';
import { PasswordAlgorithm } from './password-algorithm.interface';

export * from './password-algorithm.interface';

export const passwordAlgorithms: PasswordAlgorithm[] = [argon2Algorithm, bcryptAlgorithm];
