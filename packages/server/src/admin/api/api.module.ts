import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';
import { ApiToken } from './entities/api-token.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiToken])],
  providers: [ApiService],
  controllers: [ApiController],
  exports: [ApiService],
})
export class ApiModule {}
