import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ConfigController } from './config.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config } from './entities/config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Config])],
  providers: [ConfigService],
  controllers: [ConfigController],
})
export class ConfigModule implements OnModuleInit {
  constructor (private configService: ConfigService) {}
  
  async onModuleInit() {
    await this.configService.init()
  }
}
