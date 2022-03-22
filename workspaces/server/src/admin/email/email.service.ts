import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
import { User } from '../users/entities/user.entity';
import { EmailInput } from './dto/email.input';
import { TestEmailInput } from './dto/test-email.input';
import { EmailActivation } from './entities/email-activation.entity';
import { EmailMessage } from './entities/email-message.entity';
import { EmailMessageType } from './enums/email-message-type.enum';
import { customAlphabet } from 'nanoid';
import { ThrottlerException } from '@nestjs/throttler';
import { MomentWrapper } from '@common';
import { UserDto } from '../users/dto/user.dto';
import { VerifyInput } from 'src/auth/dto/verify.input';

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);

  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(EmailMessage)
    private emailMessagesRepository: Repository<EmailMessage>,
    @InjectRepository(EmailActivation)
    private emailActivationsRepository: Repository<EmailActivation>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailerService: MailerService,
  ) {}

  find(): Promise<EmailMessage[]> {
    return this.emailMessagesRepository.find();
  }

  findOne(id: string): Promise<EmailMessage> {
    return this.emailMessagesRepository.findOne(id);
  }

  async update(id: string, input: EmailInput): Promise<EmailMessage> {
    const message = await this.findOne(id);

    if (!message) {
      throw new NotFoundException();
    }

    message.title = input.title;
    message.content = input.content;

    return this.emailMessagesRepository.save(message);
  }

  test(input: TestEmailInput) {
    return this.mailerService
      .sendMail({
        to: input.email,
        subject: 'Test Email',
        text: 'Test Email sent by UnicoreCMS',
      })
      .then((res) => {})
      .catch((e) => {
        this.logger.error(e.toString());
        throw new ServiceUnavailableException();
      });
  }

  async sendActivation(user: User) {
    if (
      (await this.emailActivationsRepository.count({
        created: MoreThan(this.moment().utc().subtract(5, 'minutes').toDate()),
        user,
      })) > 2
    ) {
      throw new ThrottlerException();
    }

    const { content, title } = await this.emailMessagesRepository.findOne(EmailMessageType.Activation);

    const activation = new EmailActivation();
    const code = customAlphabet('1234567890', 6)();

    const html = content.replace('{USERNAME}', user.username).replace('{SITENAME}', envConfig.sitename).replace('{CODE}', code);

    activation.user = user;
    activation.code = code;

    await this.emailActivationsRepository.save(activation);

    this.mailerService.sendMail({ to: user.email, subject: title, html }).catch((e) => {
      this.logger.error(e.toString());
    });
  }

  async checkCode(user: User, input: VerifyInput): Promise<UserDto> {
    const exist = await this.emailActivationsRepository.findOne({ user, code: input.code });

    if (exist) {
      await this.emailActivationsRepository.delete({ user });

      user.activated = true;
      await this.usersRepository.save(user);

      return new UserDto(user);
    } else {
      throw new NotFoundException();
    }
  }
}
