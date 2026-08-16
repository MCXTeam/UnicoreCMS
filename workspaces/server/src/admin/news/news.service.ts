import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { In, IsNull, Repository } from 'typeorm';
import { PublishMode, WebhookDeliveriesService } from '../webhook/webhook-deliveries.service';
import { WebhookDeliveryDto, WebhookTargetDto } from '../webhook/dto/webhook-target.dto';
import { NewsInput } from './dto/news.input';
import { News } from './entities/news.entity';
import { HtmlSlice } from 'htmlslice';
import { applyCustomCode, assertUploadedFile, NEWS_PREVIEW_LENGTH, StorageManager } from '@common';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    private deliveriesService: WebhookDeliveriesService,
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

    this.deliveriesService
      .enqueueNews(saved, PublishMode.Auto, input.webhooks)
      .catch((e) => this.logger.error(`Не удалось поставить новость ${saved.id} в очередь вебхуков: ${e}`));

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

    const saved = await this.newsRepository.save(news);

    this.deliveriesService
      .enqueueUpdate(saved)
      .catch((e) => this.logger.error(`Не удалось обновить публикации новости ${saved.id}: ${e}`));

    return saved;
  }

  async publish(id: number, mode: PublishMode, webhooks?: number[]): Promise<WebhookDeliveryDto[]> {
    const news = await this.findOne(id);
    const queued = await this.deliveriesService.enqueueNews(news, mode, webhooks);

    return queued.map((delivery) => new WebhookDeliveryDto(delivery));
  }

  async publishTargets(): Promise<WebhookTargetDto[]> {
    return (await this.deliveriesService.targets()).map((webhook) => new WebhookTargetDto(webhook));
  }

  async retryDelivery(id: number): Promise<WebhookDeliveryDto> {
    const delivery = await this.deliveriesService.retry(id);

    if (!delivery) throw new NotFoundException();

    return new WebhookDeliveryDto(delivery);
  }

  async deliveries(id: number): Promise<WebhookDeliveryDto[]> {
    return (await this.deliveriesService.findByNews(id)).map((delivery) => new WebhookDeliveryDto(delivery));
  }

  async remove(id: number) {
    const news = await this.newsRepository.findOneBy({ id });

    if (!news) {
      throw new NotFoundException();
    }

    await this.deliveriesService.removePosts(id);

    return this.newsRepository.remove(news);
  }

  async removeMany(ids: number[]) {
    const news = await this.newsRepository.findBy({ id: In(ids) });

    for (const item of news) await this.deliveriesService.removePosts(item.id);

    return this.newsRepository.remove(news);
  }

  async updateMedia(id: number, file: Express.Multer.File) {
    assertUploadedFile(file);

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
