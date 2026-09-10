import { MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Transactional } from 'typeorm-transactional';
import { envConfig } from 'unicore-common';
import { events } from 'unicore-api';
import { User } from '../users/entities/user.entity';
import { EmailInput } from './dto/email.input';
import { TestEmailInput } from './dto/test-email.input';
import { EmailActivation } from './entities/email-activation.entity';
import { EmailChange } from './entities/email-change.entity';
import { EmailMessage } from './entities/email-message.entity';
import { EmailMessageType } from './enums/email-message-type.enum';

import {
  EMAIL_ACTIVATION_MAX_ATTEMPTS,
  EMAIL_ACTIVATION_RESEND_MAX,
  EMAIL_ACTIVATION_RESEND_WINDOW_MINUTES,
  EMAIL_ACTIVATION_TTL_MINUTES,
  EMAIL_CHANGE_SAME,
  EMAIL_CHANGE_TAKEN,
  EMAIL_CHANGE_WRONG_PASSWORD,
  EMAIL_CODE_ALPHABET,
  EMAIL_CODE_EXPIRED,
  EMAIL_CODE_INVALID,
  EMAIL_CODE_LENGTH,
  MomentWrapper,
  PASSWORD_RESET_HASH_LENGTH,
  PASSWORD_RESET_MAX,
  PASSWORD_RESET_TTL_MINUTES,
  PASSWORD_RESET_WINDOW_MINUTES,
  TooManyAttemptsException,
  randomFromAlphabet,
  randomId,
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

export interface EmailChangeRequest {
  email: string;
  password: string;
}

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
    @InjectRepository(EmailChange)
    private emailChangesRepository: Repository<EmailChange>,
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
    await this.assertResendAllowed(this.emailActivationsRepository, user);

    const { content, title } = await this.contentTranslations.localize(
      'email_message',
      EmailMessageType.Activation,
      user.locale,
      await this.emailMessagesRepository.findOneBy({ id: EmailMessageType.Activation }),
    );

    const activation = new EmailActivation();
    const code = randomFromAlphabet(EMAIL_CODE_ALPHABET, EMAIL_CODE_LENGTH);

    const html = renderEmailTemplate(content, { USERNAME: user.username, SITENAME: envConfig.sitename, CODE: code });

    activation.user = user;
    activation.code = code;

    await this.emailActivationsRepository.save(activation);

    this.mailerService.sendMail({ to: user.email, subject: title, html }).catch((e) => {
      this.logger.error(e.toString());
    });
  }

  private async takeCode<T extends { code: string; attempts: number }>(
    repository: Repository<T>,
    user: User,
    code: string,
  ): Promise<T> {
    const pending = await repository.findOne({
      where: {
        user: { uuid: user.uuid },
        created: MoreThan(this.moment().utc().subtract(EMAIL_ACTIVATION_TTL_MINUTES, 'minutes').toDate()),
      } as any,
      order: { created: 'DESC' } as any,
    });

    if (!pending) throw new NotFoundException(EMAIL_CODE_EXPIRED);

    if (safeEqual(pending.code, code)) return pending;

    pending.attempts += 1;

    if (pending.attempts < EMAIL_ACTIVATION_MAX_ATTEMPTS) {
      await repository.save(pending as any);

      throw new NotFoundException(EMAIL_CODE_INVALID);
    }

    await repository.delete({ user: { uuid: user.uuid } } as any);

    throw new NotFoundException(EMAIL_CODE_EXPIRED);
  }

  private async assertResendAllowed<T>(repository: Repository<T>, user: User): Promise<void> {
    const recent = await repository.countBy({
      created: MoreThan(this.moment().utc().subtract(EMAIL_ACTIVATION_RESEND_WINDOW_MINUTES, 'minutes').toDate()),
      user: { uuid: user.uuid },
    } as any);

    if (recent >= EMAIL_ACTIVATION_RESEND_MAX) throw new TooManyAttemptsException(EMAIL_ACTIVATION_RESEND_WINDOW_MINUTES * 60);
  }

  async checkCode(user: User, input: VerifyInput): Promise<UserDto> {
    await this.takeCode(this.emailActivationsRepository, user, input.code);

    await this.emailActivationsRepository.delete({ user: { uuid: user.uuid } });

    user.activated = true;
    await this.usersRepository.update({ uuid: user.uuid }, { activated: true });

    return new UserDto(user);
  }

  private async assertOwner(user: User, password: string): Promise<void> {
    const { valid } = await this.passwordService.verify(password, user.password, passwordAad(user.uuid));

    if (!valid) throw new BadRequestException(EMAIL_CHANGE_WRONG_PASSWORD);
  }

  private takenBy(email: string): Promise<User> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async sendEmailChange(user: User, input: EmailChangeRequest): Promise<void> {
    const address = input.email.trim();

    await this.assertOwner(user, input.password);

    if (user.email && user.email.toLowerCase() === address.toLowerCase()) throw new BadRequestException(EMAIL_CHANGE_SAME);
    if (await this.takenBy(address)) throw new ConflictException(EMAIL_CHANGE_TAKEN);

    await this.assertResendAllowed(this.emailChangesRepository, user);

    const { content, title } = await this.contentTranslations.localize(
      'email_message',
      EmailMessageType.EmailChange,
      user.locale,
      await this.emailMessagesRepository.findOneBy({ id: EmailMessageType.EmailChange }),
    );

    const change = new EmailChange();
    const code = randomFromAlphabet(EMAIL_CODE_ALPHABET, EMAIL_CODE_LENGTH);

    change.user = user;
    change.email = address;
    change.code = code;

    await this.emailChangesRepository.delete({ user: { uuid: user.uuid } });
    await this.emailChangesRepository.save(change);

    const html = renderEmailTemplate(content, { USERNAME: user.username, SITENAME: envConfig.sitename, CODE: code });

    this.mailerService.sendMail({ to: address, subject: title, html }).catch((e) => {
      this.logger.error(e.toString());
    });
  }

  @Transactional()
  async confirmEmailChange(user: User, input: VerifyInput): Promise<UserDto> {
    const change = await this.takeCode(this.emailChangesRepository, user, input.code);
    const previous = user.email;

    if (await this.takenBy(change.email)) {
      await this.emailChangesRepository.delete({ user: { uuid: user.uuid } });

      throw new ConflictException(EMAIL_CHANGE_TAKEN);
    }

    await this.usersRepository.update({ uuid: user.uuid }, { email: change.email, activated: true });
    await this.emailChangesRepository.delete({ user: { uuid: user.uuid } });
    await this.emailActivationsRepository.delete({ user: { uuid: user.uuid } });

    user.email = change.email;
    user.activated = true;

    await this.noticeEmailChanged(user, previous);

    return new UserDto(user);
  }

  private async noticeEmailChanged(user: User, previous: string | null): Promise<void> {
    if (!previous) return;

    try {
      const { content, title } = await this.contentTranslations.localize(
        'email_message',
        EmailMessageType.EmailChanged,
        user.locale,
        await this.emailMessagesRepository.findOneBy({ id: EmailMessageType.EmailChanged }),
      );

      const html = renderEmailTemplate(content, {
        USERNAME: user.username,
        SITENAME: envConfig.sitename,
        EMAIL: user.email,
      });

      await this.mailerService.sendMail({ to: previous, subject: title, html });
    } catch (e) {
      this.logger.error(String(e));
    }
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
      throw new TooManyAttemptsException(PASSWORD_RESET_WINDOW_MINUTES * 60);
    }

    const { content, title } = await this.contentTranslations.localize(
      'email_message',
      EmailMessageType.Reset,
      user.locale,
      await this.emailMessagesRepository.findOneBy({ id: EmailMessageType.Reset }),
    );

    const activation = new PasswordReset();
    const hash = randomId(PASSWORD_RESET_HASH_LENGTH);

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
      await this.passwordPolicyService.assert(input.password, { username: exist.user.username, email: exist.user.email });

      await this.passwordResetRepository.delete({ user: { uuid: exist.user.uuid } });

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
