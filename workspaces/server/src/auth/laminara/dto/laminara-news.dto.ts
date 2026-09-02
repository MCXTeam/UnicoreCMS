import { envConfig } from 'unicore-common';
import { htmlToSocial } from 'src/common/social/html-to-social';
import { SocialFormat } from 'src/common/social/social-format.enum';
import { News } from 'src/admin/news/entities/news.entity';

export class LaminaraNewsItemDto {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  link: string;
  banner?: string;

  constructor(news: News) {
    const site = String(envConfig.baseurl || '').replace(/\/$/, '');
    const api = String(envConfig.apiBaseurl || '').replace(/\/$/, '');

    this.id = String(news.id);
    this.title = htmlToSocial(news.title || '', SocialFormat.PlainText);
    this.body = htmlToSocial(news.description || news.short_description || '', SocialFormat.PlainText);
    this.publishedAt = new Date(news.published_at).toISOString();
    this.link = news.link || `${site}/news/${news.id}`;
    this.banner = news.image ? `${api}/${news.image}` : undefined;
  }
}

export class LaminaraNewsDto {
  items: LaminaraNewsItemDto[];

  constructor(items: News[]) {
    this.items = items.map((news) => new LaminaraNewsItemDto(news));
  }
}

export class LaminaraPingDto {
  name: string;
  version?: string;

  constructor(partial: LaminaraPingDto) {
    Object.assign(this, partial);
  }
}
