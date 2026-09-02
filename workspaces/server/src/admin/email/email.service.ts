import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { envConfig } from 'unicore-common';
import { events } from 'unicore-api';
import { User } from '../users/entities/user.entity';
import { EmailInput } from './dto/email.input';
import { TestEmailInput } from './dto/test-email.input';
import { EmailActivation } from './entities/email-activation.entity';
import { EmailMessage } from './entities/email-message.entity';
import { EmailMessageType } from './enums/email-message-type.enum';
import { nanoid, customAlphabet } from 'nanoid';
import { ThrottlerException } from '@nestjs/throttler';
import {
  EMAIL_ACTIVATION_MAX_ATTEMPTS,
  EMAIL_ACTIVATION_RESEND_MAX,
  EMAIL_ACTIVATION_RESEND_WINDOW_MINUTES,
  EMAIL_ACTIVATION_TTL_MINUTES,
  EMAIL_CODE_ALPHABET,
  EMAIL_CODE_LENGTH,
  MomentWrapper,
  PASSWORD_RESET_HASH_LENGTH,
  PASSWORD_RESET_MAX,
  PASSWORD_RESET_TTL_MINUTES,
  PASSWORD_RESET_WINDOW_MINUTES,
  safeEqual,
} from '@common';
import { UserDto } from '../users/dto/user.dto';
import { VerifyInput } from 'src/auth/dto/verify.input';
import { PasswordReset } from './entities/password-reset.entity';
import { PasswordResetInput } from 'src/auth/dto/password-reset.input';
import { renderEmailTemplate } from './email.utils';
import { PasswordLinkInput } from 'src/auth/dto/password-link.input';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { PasswordService } from 'src/auth/password/password.service';
import { PasswordPolicyService } from 'src/auth/password/password-policy.service';
import { passwordAad } from 'src/auth/password/password-aad';
import { ContentTranslationsService } from '../locales/content-translations.service';

@Injectable()
export class EmailService {
  private logger = new Logger(EmailService.name);

  constructor(
    @Inject('moment')
    private moment: MomentWrapper,
    @InjectRepository(RefreshToken)
    private tokensRepo: Repository<RefreshToken>,
    @InjectRepository(EmailMessage)
    private emailMessagesRepository: Repository<EmailMessage>,
    @InjectRepository(EmailActivation)
    private emailActivationsRepository: Repository<EmailActivation>,
    @InjectRepository(PasswordReset)
    private passwordResetRepository: Repository<PasswordReset>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private mailerService: MailerService,
    private passwordService: PasswordService,
    private passwordPolicyService: PasswordPolicyService,
    private contentTranslations: ContentTranslationsService,
  ) {}

  find(): Promise<EmailMessage[]> {
    return this.emailMessagesRepository.find();
  }

  findOne(id: EmailMessageType): Promise<EmailMessage> {
    return this.emailMessagesRepository.findOneBy({ id });
  }

  async update(id: EmailMessageType, input: EmailInput): Promise<EmailMessage> {
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
      (await this.emailActivationsRepository.countBy({
        created: MoreThan(this.moment().utc().subtract(EMAIL_ACTIVATION_RESEND_WINDOW_MINUTES, 'minutes').toDate()),
        user: { uuid: user.uuid },
      })) >= EMAIL_ACTIVATION_RESEND_MAX
    ) {
      throw new ThrottlerException();
    }

    const { content, title } = await this.contentTranslations.localize(
      'email_message',
      EmailMessageType.Activation,
      user.locale,
      await this.emailMessagesRepository.findOneBy({ id: EmailMessageType.Activation }),
    );

    const activation = new EmailActivation();
    const code = customAlphabet(EMAIL_CODE_ALPHABET, EMAIL_CODE_LENGTH)();

    const html = renderEmailTemplate(content, { USERNAME: user.username, SITENAME: envConfig.sitename, CODE: code });

    activation.user = user;
    activation.code = code;

    await this.emailActivationsRepository.save(activation);

    this.mailerService.sendMail({ to: user.email, subject: title, html }).catch((e) => {
      this.logger.error(e.toString());
    });
  }

  async checkCode(user: User, input: VerifyInput): Promise<UserDto> {
    const activation = await this.emailActivationsRepository.findOne({
      where: {
        user: { uuid: user.uuid },
        created: MoreThan(this.moment().utc().subtract(EMAIL_ACTIVATION_TTL_MINUTES, 'minutes').toDate()),
      },
      order: { created: 'DESC' },
    });

    if (!activation) {
      throw new NotFoundException();
    }

    if (!safeEqual(activation.code, input.code)) {
      activation.attempts += 1;

      if (activation.attempts >= EMAIL_ACTIVATION_MAX_ATTEMPTS) {
        await this.emailActivationsRepository.delete({ user: { uuid: user.uuid } });
      } else {
        await this.emailActivationsRepository.save(activation);
      }

      throw new NotFoundException();
    }

    await this.emailActivationsRepository.delete({ user: { uuid: user.uuid } });

    user.activated = true;
    await this.usersRepository.update({ uuid: user.uuid }, { activated: true });

    return new UserDto(user);
  }

  async sendGift(recipient: User, sender: string, gift: string) {
    if (!recipient.email) return;

    const { content, title } = await this.contentTranslations.localize(
      'email_message',
      EmailMessageType.Gift,
      recipient.locale,
      await this.emailMessagesRepository.findOneBy({ id: EmailMessageType.Gift }),
    );

    const html = renderEmailTemplate(content, {
      USERNAME: recipient.username,
      SENDER: sender,
      SITENAME: envConfig.sitename,
      GIFT: gift,
    });

    this.mailerService.sendMail({ to: recipient.email, subject: title, html }).catch((e) => {
      this.logger.error(e.toString());
    });
  }

  async sendPasswordLink(ip: string, input: PasswordLinkInput) {
    const user = await this.usersRepository.findOneBy({ email: input.email });
    if (!user) return;

    if (
      (await this.passwordResetRepository.count({
        where: [
          {
            created: MoreThan(this.moment().utc().subtract(PASSWORD_RESET_WINDOW_MINUTES, 'minutes').toDate()),
            user: { uuid: user.uuid },
          },
          {
            created: MoreThan(this.moment().utc().subtract(PASSWORD_RESET_WINDOW_MINUTES, 'minutes').toDate()),
            ip,
          },
        ],
      })) >= PASSWORD_RESET_MAX
    ) {
      throw new ThrottlerException();
    }

    const { content, title } = await this.contentTranslations.localize(
      'email_message',
      EmailMessageType.Reset,
      user.locale,
      await this.emailMessagesRepository.findOneBy({ id: EmailMessageType.Reset }),
    );

    const activation = new PasswordReset();
    const hash = nanoid(PASSWORD_RESET_HASH_LENGTH);

    const link = new URL(envConfig.baseurl);
    link.pathname = '/auth/password';
    link.searchParams.append('hash', hash);

    const html = renderEmailTemplate(content, {
      IP: ip,
      USERNAME: user.username,
      SITENAME: envConfig.sitename,
      LINK: link.href,
    });

    activation.user = user;
    activation.hash = hash;
    activation.ip = ip;

    await this.passwordResetRepository.save(activation);

    this.mailerService.sendMail({ to: user.email, subject: title, html }).catch((e) => {
      this.logger.error(e.toString());
    });
  }

  async checkHash(input: PasswordResetInput): Promise<UserDto> {
    const exist = await this.passwordResetRepository.findOne({
      where: {
        hash: input.hash,
        created: MoreThan(this.moment().utc().subtract(PASSWORD_RESET_TTL_MINUTES, 'minutes').toDate()),
      },
      relations: ['user'],
    });

    if (!exist) throw new NotFoundException();

    if (input.password) {
      await this.passwordResetRepository.delete({ user: { uuid: exist.user.uuid } });

      await this.passwordPolicyService.assert(input.password, { username: exist.user.username, email: exist.user.email });

      exist.user.password = await this.passwordService.hash(input.password, passwordAad(exist.user.uuid));

      exist.user.password_change_required = false;

      await this.usersRepository.update(
        { uuid: exist.user.uuid },
        { password: exist.user.password, password_change_required: false },
      );
      await this.tokensRepo.delete({ user: { uuid: exist.user.uuid } });

      await events().emit('user.password.changed', { uuid: exist.user.uuid, username: exist.user.username });
    }

    return new UserDto(exist.user);
  }
}
