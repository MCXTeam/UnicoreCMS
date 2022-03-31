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
import { nanoid, customAlphabet } from 'nanoid';
import { ThrottlerException } from '@nestjs/throttler';
import { MomentWrapper } from '@common';
import { UserDto } from '../users/dto/user.dto';
import { VerifyInput } from 'src/auth/dto/verify.input';
import { PasswordReset } from './entities/password-reset.entity';
import { PasswordResetInput } from 'src/auth/dto/password-reset.input';
import * as bcrypt from 'bcrypt';
import { PasswordLinkInput } from 'src/auth/dto/password-link.input';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

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

  async sendPasswordLink(ip: string, input: PasswordLinkInput) {
    const user = await this.usersRepository.findOne({ email: input.email })
    if (!user) throw new NotFoundException()

    if (
      (await this.passwordResetRepository.count({where: [
        {
          created: MoreThan(this.moment().utc().subtract(5, 'minutes').toDate()),
          user,
        },
        {
          created: MoreThan(this.moment().utc().subtract(5, 'minutes').toDate()),
          ip,
        }
      ]})) > 2
    ) {
      throw new ThrottlerException();
    }

    const { content, title } = await this.emailMessagesRepository.findOne(EmailMessageType.Reset);

    const activation = new PasswordReset();
    const hash = nanoid(32);

    const link = new URL(envConfig.baseurl)
    link.pathname = "/auth/password"
    link.searchParams.append("hash", hash)

    const html = content.replace('{IP}', ip).replace('{USERNAME}', user.username).replace('{SITENAME}', envConfig.sitename).replace('{LINK}', link.href);

    activation.user = user;
    activation.hash = hash;
    activation.ip = ip;

    await this.passwordResetRepository.save(activation);

    this.mailerService.sendMail({ to: user.email, subject: title, html }).catch((e) => {
      this.logger.error(e.toString());
    });
  }

  async checkHash(input: PasswordResetInput): Promise<UserDto> {
    const exist = await this.passwordResetRepository.findOne({ hash: input.hash }, { relations: ['user'] });

    if (exist) {
      if (input.password) {
        await this.passwordResetRepository.delete({ user: exist.user });
        exist.user.password = bcrypt.hashSync(input.password, 10);
        await this.usersRepository.save(exist.user);

        if (input.close)
          await this.tokensRepo.delete({ user: exist.user })
      } 

      return new UserDto(exist.user)
    } else {
      throw new NotFoundException();
    }
  }
}
