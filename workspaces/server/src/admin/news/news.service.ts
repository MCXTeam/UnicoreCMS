import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { In, IsNull, Repository } from 'typeorm';
import { WebhookType } from '../webhook/enums/webhook-type.enum';
import { WebhooksService } from '../webhook/webhooks.service';
import { NewsInput } from './dto/news.input';
import { News } from './entities/news.entity';
import { HtmlSlice } from 'htmlslice';
import { applyCustomCode, NEWS_PREVIEW_LENGTH, StorageManager } from '@common';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    private webhooksService: WebhooksService,
  ) {}

  async create(input: NewsInput, file?: Express.Multer.File, allowCustomCode = false): Promise<News> {
    const news = new News();

    news.title = input.title;
    news.description = input.description;
    news.short_description = input.short_description;
    news.full_size = Boolean(input.full_size);
    news.image = file?.filename;

    applyCustomCode(news, input, allowCustomCode);

    const saved = await this.newsRepository.save(news);

    this.webhooksService.send(WebhookType.NewsCreated, { ...saved });

    return saved;
  }

  async find(query: PaginateQuery): Promise<Paginated<News>> {
    const paginated = await paginate(query, this.newsRepository, {
      sortableColumns: ['id', 'title', 'created'],
      defaultSortBy: [['created', 'DESC']],
      maxLimit: 100,
    });

    return {
      ...paginated,
      data: paginated.data.map((news) => this.withPreview(news)),
    };
  }

  private withPreview(news: News): News {
    let content = news.description;

    Object.defineProperty(news, 'description', {
      get: () => (news.short_description ? news.short_description : this.slice(content)),
      set: (value: string) => {
        content = value;
      },
      enumerable: true,
      configurable: true,
    });

    return news;
  }

  private slice(content: string): string {
    const sliced = new HtmlSlice(content);

    return sliced.length > NEWS_PREVIEW_LENGTH ? sliced.slice(0, NEWS_PREVIEW_LENGTH) + '...' : content;
  }

  async findForMap(): Promise<number[]> {
    return (
      await this.newsRepository.find({
        where: {
          link: IsNull(),
        },
        order: {
          created: 'DESC',
        },
      })
    ).map((news) => news.id);
  }

  async findOne(id: number) {
    const news = await this.newsRepository.findOneBy({ id });
    if (!news) throw new NotFoundException();
    return news;
  }

  async update(id: number, input: NewsInput, allowCustomCode = false): Promise<News> {
    const news = await this.newsRepository.findOneBy({ id });

    if (!news) throw new NotFoundException();

    news.title = input.title;
    news.description = input.description;
    news.short_description = input.short_description;
    news.full_size = Boolean(input.full_size);

    applyCustomCode(news, input, allowCustomCode);

    return this.newsRepository.save(news);
  }

  async remove(id: number) {
    const news = await this.newsRepository.findOneBy({ id });

    if (!news) {
      throw new NotFoundException();
    }

    return this.newsRepository.remove(news);
  }

  async removeMany(ids: number[]) {
    const news = await this.newsRepository.findBy({ id: In(ids) });

    return this.newsRepository.remove(news);
  }

  async updateMedia(id: number, file: Express.Multer.File) {
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
