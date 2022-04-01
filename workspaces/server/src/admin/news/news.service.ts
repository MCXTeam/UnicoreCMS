import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MulterFile } from 'fastify-file-interceptor';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { IsNull, Repository } from 'typeorm';
import { WebhookType } from '../webhook/enums/webhook-type.enum';
import { WebhooksService } from '../webhook/webhooks.service';
import { NewsInput } from './dto/news.input';
import { News } from './entities/news.entity';
import { HtmlSlice } from 'htmlslice';
import { StorageManager } from '@common';

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
        const description = sliced.length > 300 ? sliced.slice(0, 300) + '...' : news.description;

        return {
          ...news,
          description,
        };
      }),
    };
  }

  async findForMap(): Promise<number[]> {
    return (await this.newsRepository.find({ 
      where: {
        link: IsNull()
      },
      order: {
        created: 'DESC'
      }
    })).map(news => news.id)
  }

  async findOne(id: number) {
    const news = await this.newsRepository.findOne(id)
    if (!news) throw new NotFoundException()
    return news
  }

  async update(id: number, input: NewsInput): Promise<News> {
    const news = await this.newsRepository.findOne(id)

    if (!news) throw new NotFoundException()

    news.title = input.title;
    news.description = input.description;

    return this.newsRepository.save(news);
  }

  async remove(id: number) {
    const news = await this.newsRepository.findOne(id);

    if (!news) {
      throw new NotFoundException();
    }

    return this.newsRepository.remove(news);
  }

  async removeMany(ids: number[]) {
    const news = await this.newsRepository.findByIds(ids);

    return this.newsRepository.remove(news);
  }

  async updateMedia(id: number, file: MulterFile) {
    const news = await this.findOne(id);

    if (!news) {
      StorageManager.remove(file.filename);
      throw new NotFoundException();
    }

    StorageManager.remove(news.image);
    news.image = file.filename;

    return this.newsRepository.save(news);
  }

  async removeMedia(id: number) {
    const news = await this.findOne(id);

    if (!news) {
      throw new NotFoundException();
    }

    StorageManager.remove(news.image);
    news.image = null;

    return this.newsRepository.save(news);
  }
}
