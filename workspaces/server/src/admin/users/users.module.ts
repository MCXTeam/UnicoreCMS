import { forwardRef, Logger, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Role } from '../roles/entities/role.entity';
import { faker } from '@faker-js/faker';
import { UserInput } from './dto/user.input';
import { PlaytimeModule } from 'src/game/cabinet/playtime/playtime.module';
import { Vote } from 'src/game/cabinet/votes/entities/vote.entity';
import { ReferalsModule } from 'src/game/cabinet/referals/referals.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Vote]), forwardRef(() => PlaytimeModule), forwardRef(() => ReferalsModule)],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export default class UsersModule implements OnModuleInit {
  private logger = new Logger(UsersModule.name);

  constructor(private usersService: UsersService) {}

  async onModuleInit() {
    await this.usersService.genKernel();

    if ((await this.usersService.count()) == 0) {
      const input = new UserInput();

      input.username = 'admin';
      input.password = faker.internet.password(16);
      input.superuser = true;
      input.activated = true;

      await this.usersService.create(input);

      this.logger.warn('Administrator account has been created');
      this.logger.warn(`Username: ${input.username}`);
      this.logger.warn(`Password: ${input.password}`);
      this.logger.warn('Save or remember this information');
    }
  }
}
