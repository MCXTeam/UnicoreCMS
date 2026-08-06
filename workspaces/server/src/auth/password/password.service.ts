import { Injectable, Logger } from '@nestjs/common';
import { envConfig } from 'unicore-common';
import { CRYPTO_PURPOSE_PASSWORD, decrypt, encrypt, isCurrentKey, isEncrypted } from '@common';
import { passwordAlgorithms, PasswordAlgorithm } from './algorithms';

export interface PasswordVerifyResult {
  valid: boolean;
  rehashed?: string;
}

@Injectable()
export class PasswordService {
  private logger = new Logger(PasswordService.name);

  private get target(): PasswordAlgorithm {
    return passwordAlgorithms.find((algorithm) => algorithm.id === envConfig.passwordAlgorithm) ?? passwordAlgorithms[0];
  }

  private algorithmFor(phc: string): PasswordAlgorithm {
    return passwordAlgorithms.find((algorithm) => algorithm.matches(phc));
  }

  private unwrap(stored: string, aad: string): string {
    if (!isEncrypted(stored)) return stored;

    return decrypt(stored, CRYPTO_PURPOSE_PASSWORD, aad);
  }

  async hash(plain: string, aad: string): Promise<string> {
    return encrypt(await this.target.hash(plain), CRYPTO_PURPOSE_PASSWORD, aad);
  }

  async verify(plain: string, stored: string, aad: string): Promise<PasswordVerifyResult> {
    if (!plain || !stored) return { valid: false };

    let phc: string;

    try {
      phc = this.unwrap(stored, aad);
    } catch {
      this.logger.error('Password hash cannot be decrypted, check ENCRYPTION_KEY');
      return { valid: false };
    }

    const algorithm = this.algorithmFor(phc);

    if (!algorithm) return { valid: false };
    if (!(await algorithm.verify(plain, phc))) return { valid: false };

    if (this.needsRehash(stored, phc, algorithm, aad)) {
      return { valid: true, rehashed: await this.hash(plain, aad) };
    }

    return { valid: true };
  }

  private needsRehash(stored: string, phc: string, algorithm: PasswordAlgorithm, aad: string): boolean {
    if (!isCurrentKey(stored, CRYPTO_PURPOSE_PASSWORD, aad)) return true;
    if (algorithm.id !== this.target.id) return true;

    return algorithm.outdated(phc);
  }
}
