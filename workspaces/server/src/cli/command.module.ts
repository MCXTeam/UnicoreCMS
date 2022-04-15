import { CacheModule, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import UsersModule from "src/admin/users/users.module";
import { ormconfig } from "src/ormconfig";
import { UsersCommandCreate } from "./commands/users.commands";

@Module({
  imports: [
    TypeOrmModule.forRoot(ormconfig),
    CacheModule.register({
      isGlobal: true
    }),
    UsersModule
  ],
  providers: [UsersCommandCreate]
})
export class CommandsModule {}