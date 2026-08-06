import { Command, CommandRunner } from 'nest-commander';
import * as clc from 'cli-color';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CRYPTO_PURPOSE_PASSWORD, decrypt, encrypt, isCurrentKey } from '@common';
import { passwordAad } from 'src/auth/password/password-aad';
import { User } from 'src/admin/users/entities/user.entity';
import { RCON } from 'src/game/servers/rcon/entities/rcon.entity';
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
  ) {
    super();
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

      if (user.two_factor_secret || user.two_factor_secret_temp) secrets++;

      await this.usersRepository.update(
        { uuid: user.uuid },
        {
          password: user.password,
          two_factor_secret: user.two_factor_secret,
          two_factor_secret_temp: user.two_factor_secret_temp,
        },
      );
    }

    const rcons = await this.rconRepository.find();

    for (const rcon of rcons) {
      await this.rconRepository.update({ serverId: rcon.serverId }, { password: rcon.password });
    }

    stdout(clc.magenta('Secrets re-encrypted with the current key'));
    stdout(`Passwords: ${clc.magenta(String(passwords))}`);
    stdout(`Two-factor secrets: ${clc.magenta(String(secrets))}`);
    stdout(`RCON passwords: ${clc.magenta(String(rcons.length))}`);

    if (failed) stdout(clc.red(`Failed to decrypt: ${failed} (wrong ENCRYPTION_KEY_PREVIOUS?)`));
  }
}
