import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { WebhooksModule } from '../webhook/webhooks.module';

@Module({
  imports: [TypeOrmModule.forFeature([News]), WebhooksModule],
  providers: [NewsService],
  controllers: [NewsController],
})
export class NewsModule {}
