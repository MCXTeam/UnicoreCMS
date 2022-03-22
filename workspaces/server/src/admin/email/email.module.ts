import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailActivation } from './entities/email-activation.entity';
import { EmailMessage } from './entities/email-message.entity';
import { EmailMessageType } from './enums/email-message-type.enum';

@Module({
  imports: [TypeOrmModule.forFeature([EmailMessage, EmailActivation, User])],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule implements OnModuleInit {
  private logger = new Logger();

  constructor(@InjectRepository(EmailMessage) private emailMessagesRepository: Repository<EmailMessage>) {}

  async onModuleInit() {
    await this.emailMessagesRepository
      .createQueryBuilder()
      .insert()
      .into(EmailMessage)
      .values([
        {
          id: EmailMessageType.Activation,
          title: 'Подтверждение регистрации',
          content: `<h1>Привет, {USERNAME}!</h1><p><br></p><p>Добро пожаловать на {SITENAME}!</p><p>Код активации вашего аккаунта:</p><h2>{CODE}</h2>`,
        },
        {
          id: EmailMessageType.Reset,
          title: 'Восстановление доступа',
          content: `<h1>Сбросить пароль?</h1><p><br></p><p>Вы запросили сброс пароля для {USERNAME}, перейдите по ссылке подтверждения ниже, чтобы завершить процесс. </p><p>{LINK}</p><p><br></p><p>Запрос отправлен с IP: {IP}</p>`,
        },
        {
          id: EmailMessageType.Device,
          title: 'Вход с нового устройства',
          content: `<h1>Привет, {USERNAME}!</h1><p><br></p><p>В ваш аккаунт был выполнен вход с нового устройства, если это не вы, немедленно смените пароль!</p><p><br></p><p>IP-адресс: {IP}</p>`,
        },
      ])
      .orIgnore()
      .execute();
  }
}
