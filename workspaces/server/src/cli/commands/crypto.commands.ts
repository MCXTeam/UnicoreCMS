import { Command, CommandRunner } from 'nest-commander';
import clc from 'cli-color';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CRYPTO_PURPOSE_PASSWORD,
  decrypt,
  decryptField,
  encrypt,
  encryptField,
  ENCRYPTED_RCON_PASSWORD,
  ENCRYPTED_SOURCE_TOKEN,
  ENCRYPTED_TWO_FACTOR_SECRET,
  ENCRYPTED_TWO_FACTOR_SECRET_TEMP,
  isCurrentKey,
} from '@common';
import { passwordAad } from 'src/auth/password/password-aad';
import { User } from 'src/admin/users/entities/user.entity';
import { RCON } from 'src/game/servers/rcon/entities/rcon.entity';
import { ExtensionSource } from 'src/modules/catalog/entities/extension-source.entity';
import { stdout } from '../stdout';

@Command({
  name: 'crypto-rewrap',
  description: 'Re-encrypt stored secrets with the current ENCRYPTION_KEY',
})
export class CryptoRewrapCommand extends CommandRunner {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(RCON)
    private rconRepository: Repository<RCON>,
    @InjectRepository(ExtensionSource)
    private sourcesRepository: Repository<ExtensionSource>,
  ) {
    super();
  }

  private rewrapField(value: string, field: string, id: string): string {
    if (!value) return value;

    try {
      return encryptField(decryptField(value, field, id), field, id);
    } catch {
      return value;
    }
  }

  async run(): Promise<void> {
    const users = await this.usersRepository.find();

    let passwords = 0;
    let secrets = 0;
    let failed = 0;

    for (const user of users) {
      const aad = passwordAad(user.uuid);

      if (user.password && !isCurrentKey(user.password, CRYPTO_PURPOSE_PASSWORD, aad)) {
        try {
          user.password = encrypt(decrypt(user.password, CRYPTO_PURPOSE_PASSWORD, aad), CRYPTO_PURPOSE_PASSWORD, aad);
          passwords++;
        } catch {
          failed++;
          continue;
        }
      }

      const rewrapped = {
        two_factor_secret: this.rewrapField(user.two_factor_secret, ENCRYPTED_TWO_FACTOR_SECRET, user.uuid),
        two_factor_secret_temp: this.rewrapField(user.two_factor_secret_temp, ENCRYPTED_TWO_FACTOR_SECRET_TEMP, user.uuid),
      };

      if (user.two_factor_secret || user.two_factor_secret_temp) secrets++;

      await this.usersRepository.update({ uuid: user.uuid }, { password: user.password, ...rewrapped });
    }

    const rcons = await this.rconRepository.find();

    for (const rcon of rcons) {
      await this.rconRepository.update(
        { serverId: rcon.serverId },
        { password: this.rewrapField(rcon.password, ENCRYPTED_RCON_PASSWORD, rcon.serverId) },
      );
    }

    const sources = (await this.sourcesRepository.find()).filter((source) => source.token);

    for (const source of sources)
      await this.sourcesRepository.update(
        { id: source.id },
        { token: this.rewrapField(source.token, ENCRYPTED_SOURCE_TOKEN, String(source.id)) },
      );

    stdout(clc.magenta('Secrets re-encrypted with the current key'));
    stdout(`Passwords: ${clc.magenta(String(passwords))}`);
    stdout(`Two-factor secrets: ${clc.magenta(String(secrets))}`);
    stdout(`RCON passwords: ${clc.magenta(String(rcons.length))}`);
    stdout(`Extension source tokens: ${clc.magenta(String(sources.length))}`);

    if (failed) stdout(clc.red(`Failed to decrypt: ${failed} (wrong ENCRYPTION_KEY_PREVIOUS?)`));
  }
}
