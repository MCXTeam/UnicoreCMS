import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageInput } from './dto/page.input';
import { Page } from './entities/page.entity';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page)
    private pagesRepository: Repository<Page>,
  ) {}

  async generate(): Promise<void> {
    try {
      await this.pagesRepository
        .createQueryBuilder()
        .insert()
        .into(Page)
        .values([
          {
            path: 'rules',
            is_rules: true,
            title: 'Правила',
            content: `<p><strong>Общие правила поведения на&nbsp;сайте:</strong></p><p><br></p><p>Начнем с&nbsp;того, что&nbsp;на&nbsp;сайте общаются сотни людей, разных религих и&nbsp;взглядов, и&nbsp;все они являются полноправными посетителями нашего сайта, поэтому если мы&nbsp;хотим чтобы это сообщество людей функционировало нам и&nbsp;необходимы правила. Мы&nbsp;настоятельно рекомендуем прочитать настоящие правила, это займет у&nbsp;вас всего минут пять, но&nbsp;сбережет нам и&nbsp;вам время и&nbsp;поможет сделать сайт более интересным и&nbsp;организованным.</p><p><br></p><p>Начнем с&nbsp;того, что&nbsp;на&nbsp;нашем сайте нужно вести себя уважительно ко&nbsp;всем посетителям сайта. Не&nbsp;надо&nbsp;оскорблений по&nbsp;отношению к&nbsp;участникам, это всегда лишнее. Если есть претензии&nbsp;— обращайтесь к&nbsp;Админам или&nbsp;Модераторам (воспользуйтесь личными сообщениями). Оскорбление других посетителей считается у&nbsp;нас одним из&nbsp;самых тяжких нарушений и&nbsp;строго наказывается администрацией. <strong>У&nbsp;нас строго запрещен расизм, религиозные и&nbsp;политические высказывания.</strong> Заранее благодарим вас за&nbsp;понимание и&nbsp;за&nbsp;желание сделать наш сайт более вежливым и&nbsp;дружелюбным.</p><p><br></p><p><strong>На&nbsp;сайте строго запрещено:</strong></p><p>—&nbsp;сообщения, не&nbsp;относящиеся к&nbsp;содержанию статьи или&nbsp;к&nbsp;контексту обсуждения</p><p>—&nbsp;оскорбление и&nbsp;угрозы в&nbsp;адрес посетителей сайта</p><p>—&nbsp;в&nbsp;комментариях запрещаются выражения, содержащие ненормативную лексику, унижающие человеческое достоинство, разжигающие межнациональную рознь</p><p>—&nbsp;спам, а&nbsp;также реклама любых товаров и&nbsp;услуг, иных ресурсов, СМИ или&nbsp;событий, не&nbsp;относящихся к&nbsp;контексту обсуждения статьи</p><p><br></p><p>Давайте будем уважать друг друга и&nbsp;сайт, на&nbsp;который Вы&nbsp;и&nbsp;другие читатели приходят пообщаться и&nbsp;высказать свои мысли. Администрация сайта оставляет за&nbsp;собой право удалять комментарии или&nbsp;часть комментариев, если они не&nbsp;соответствуют данным требованиям.</p><p><br></p><h2>При&nbsp;нарушении правил вам может быть дано <strong>предупреждение</strong>. В&nbsp;некоторых случаях может быть дан бан <strong>без&nbsp;предупреждений</strong>. По&nbsp;вопросам снятия бана писать администратору.</h2>`,
            description: 'Правила проекта',
          },
        ])
        .orIgnore()
        .execute();
    } catch {}
  }

  find(): Promise<Page[]> {
    return this.pagesRepository.find({
      select: ['title', 'path', 'id', 'is_rules'],
    });
  }

  findOne(id: number): Promise<Page> {
    return this.pagesRepository.findOne(id);
  }

  findByPath(path: string): Promise<Page> {
    return this.pagesRepository.findOne({ path });
  }

  rules(): Promise<Page> {
    return this.pagesRepository.findOne({
      is_rules: true
    });
  }

  async create(input: PageInput): Promise<Page> {
    if (await this.pagesRepository.findOne({ path: input.path })) {
      throw new ConflictException();
    }

    const page = new Page();

    page.path = input.path;
    page.title = input.title;
    page.content = input.content;
    page.description = input.description;

    return this.pagesRepository.save(page);
  }

  async update(id: number, input: PageInput): Promise<Page> {
    const page = await this.findOne(id);

    if (!page) {
      throw new NotFoundException();
    }

    if (input.path != page.path && (await this.pagesRepository.findOne({ path: input.path }))) {
      throw new ConflictException();
    }

    page.path = input.path;
    page.title = input.title;
    page.content = input.content;
    page.description = input.description;

    return this.pagesRepository.save(page);
  }

  async remove(id: number) {
    const page = await this.findOne(id);

    if (!page) {
      throw new NotFoundException();
    }

    return this.pagesRepository.remove(page);
  }
}
