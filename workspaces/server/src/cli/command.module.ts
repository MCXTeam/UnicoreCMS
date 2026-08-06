import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import { enforceSessionTimezone } from 'src/common/database';
import UsersModule from 'src/admin/users/users.module';
import { ormconfig } from 'src/ormconfig';
import { UsersCommandCreate } from './commands/users.commands';
import { SeedCommand } from './commands/seed.command';
import { CryptoRewrapCommand } from './commands/crypto.commands';
import { User } from 'src/admin/users/entities/user.entity';
import { RCON } from 'src/game/servers/rcon/entities/rcon.entity';

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
    TypeOrmModule.forFeature([User, RCON]),
  ],
  providers: [UsersCommandCreate, SeedCommand, CryptoRewrapCommand],
})
export class CommandsModule {}
