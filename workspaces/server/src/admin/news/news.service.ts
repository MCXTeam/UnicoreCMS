import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { WebhookType } from '../webhook/enums/webhook-type.enum';
import { WebhooksService } from '../webhook/webhooks.service';
import { NewsInput } from './dto/news.input';
import { News } from './entities/news.entity';
import { HtmlSlice } from 'htmlslice';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    private webhooksService: WebhooksService,
  ) {}

  create(input: NewsInput, file?: MulterFile): Promise<News> {
    const news = new News();

    news.title = input.title;
    news.description = input.description;
    news.image = file?.filename;

    this.webhooksService.send(WebhookType.NewsCreated, news);
    return this.newsRepository.save(news);
  }

  async find(query: PaginateQuery): Promise<Paginated<News>> {
    const paginated = await paginate(query, this.newsRepository, {
      sortableColumns: ['id', 'title', 'created'],
      defaultSortBy: [['created', 'DESC']],
      maxLimit: 100,
    });

    return {
      ...paginated,
      data: paginated.data.map((news) => {
        var sliced = new HtmlSlice(news.description);
        const description = sliced.length > 300 ? sliced.slice(0, 300) : news.description;

        return {
          ...news,
          description,
        };
      }),
    };
  }
}
