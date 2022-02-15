import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { Repository } from 'typeorm';
import { WebhookType } from '../webhook/enums/webhook-type.enum';
import { WebhooksService } from '../webhook/webhooks.service';
import { NewsInput } from './dto/news.input';
import { News } from './entities/news.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    private webhooksService: WebhooksService,
  ) { }

  create(input: NewsInput, file?: MulterFile): Promise<News> {
    const news = new News();

    news.title = input.title
    news.description = input.description
    news.image = file?.filename

    this.webhooksService.send(WebhookType.NewsCreated, news)
    return this.newsRepository.save(news);
  }
}
