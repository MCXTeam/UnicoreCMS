import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { enforceSessionTimezone } from 'src/common/database';
import UsersModule from 'src/admin/users/users.module';
import { PasswordModule } from 'src/auth/password/password.module';
import { RecaptchaModule } from 'src/auth/recaptcha/recaptcha.module';
import { ThrottlerModule } from 'src/common/throttler/throttler.module';
import { ormconfig } from 'src/ormconfig';
import { CLI_COMMANDS } from './commands';
import { User } from 'src/admin/users/entities/user.entity';
import { RCON } from 'src/game/servers/rcon/entities/rcon.entity';
import { ExtensionSource } from 'src/modules/catalog/entities/extension-source.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ormconfig,
      dataSourceFactory: async (options) => {
        if (!options) throw new Error('Invalid TypeORM data source options');
        const dataSource = addTransactionalDataSource(new DataSource(options));
        await dataSource.initialize();
        return enforceSessionTimezone(dataSource);
      },
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    UsersModule,
    PasswordModule,
    RecaptchaModule,
    ThrottlerModule,
    TypeOrmModule.forFeature([User, RCON, ExtensionSource]),
  ],
  providers: [...CLI_COMMANDS],
})
export class CommandsModule {}
