import { htmlToSocial } from 'src/common/social/html-to-social';
import { SocialFormat } from 'src/common/social/social-format.enum';
import { News } from '../entities/news.entity';

export class GmlNewsDto {
  id: number;
  title: string;
  description: string;
  createdAt: Date;

  constructor(news: News) {
    this.id = news.id;
    this.title = news.title;
    this.description = htmlToSocial(news.description || news.short_description || '', SocialFormat.PlainText);
    this.createdAt = news.published_at;
  }
}
