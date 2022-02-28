import { forwardRef, Module } from '@nestjs/common';
import { GravitService } from './gravit.service';
import { GravitController } from './gravit.controller';
import UsersModule from 'src/admin/users/users.module';
import { AuthModule } from '../auth.module';
import { JwtModule } from '@nestjs/jwt';
import { envConfig } from 'unicore-common';

@Module({
  imports: [
    UsersModule, 
    JwtModule.register({
      secret: envConfig.jwtKey,
      signOptions: { expiresIn: envConfig.jwtExpires },
    }),
  ],
  providers: [GravitService],
  controllers: [GravitController],
  exports: [GravitService]
})
export class GravitModule {}
