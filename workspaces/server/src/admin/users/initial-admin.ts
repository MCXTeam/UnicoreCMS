import { open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { DataSource } from 'typeorm';
import { envConfig, generatePassword, passwordIssue, projectRoot } from 'unicore-common';
import type { UsersService } from './users.service';

export async function createInitialAdmin(
  dataSource: DataSource,
  usersService: UsersService,
  credentialsPath = resolve(projectRoot, 'initial-admin.txt'),
  output: (message: string) => void = (message) => { process.stdout.write(`${message}\n`); },
): Promise<void> {
  const runner = dataSource.createQueryRunner();
  const lockName = 'unicore:initial-admin';
  let locked = false;

  try {
    await runner.connect();

    if (dataSource.options.type === 'postgres') {
      await runner.query('SELECT pg_advisory_lock(hashtext($1))', [lockName]);
      locked = true;
    } else {
      const [row] = await runner.query('SELECT GET_LOCK(?, ?) AS acquired', [lockName, 30]);

      if (Number(row?.acquired) !== 1) throw new Error('Не удалось получить блокировку создания администратора');

      locked = true;
    }

    if (await usersService.count()) return;

    const username = 'admin';
    const email = 'admin@localhost.invalid';
    let password: string;

    do {
      password = generatePassword(24);
    } while (passwordIssue(password, { username, email, sitename: envConfig.sitename }));

    const credentials = [
      'Создан администратор UnicoreCMS.',
      `Логин: ${username}`,
      `Email: ${email}`,
      `Пароль: ${password}`,
      'При первом входе смените пароль и укажите свой email. Затем удалите этот файл.',
    ].join('\n') + '\n';
    const file = await open(credentialsPath, 'wx', 0o600);

    try {
      await file.writeFile(credentials, 'utf8');
      await file.sync();
      await file.close();
      await usersService.create({ username, email, password, superuser: true, activated: true });
    } catch (error) {
      await file.close().catch(() => undefined);
      await unlink(credentialsPath);
      throw error;
    }

    output(`${credentials}Данные сохранены в ${credentialsPath}`);
  } finally {
    try {
      if (locked) {
        if (dataSource.options.type === 'postgres') await runner.query('SELECT pg_advisory_unlock(hashtext($1))', [lockName]);
        else await runner.query('SELECT RELEASE_LOCK(?)', [lockName]);
      }
    } finally {
      await runner.release();
    }
  }
}
