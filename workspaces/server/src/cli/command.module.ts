import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { addTransactionalDataSource } from 'typeorm-transactional';
import UsersModule from 'src/admin/users/users.module';
import { ormconfig } from 'src/ormconfig';
import { UsersCommandCreate } from './commands/users.commands';
import { SeedCommand } from './commands/seed.command';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ormconfig,
      dataSourceFactory: async (options) => {
        if (!options) throw new Error('Invalid TypeORM data source options');
        return addTransactionalDataSource(new DataSource(options));
      },
    }),
    CacheModule.register({
      isGlobal: true,
    }),
    UsersModule,
  ],
  providers: [UsersCommandCreate, SeedCommand],
})
export class CommandsModule {}
