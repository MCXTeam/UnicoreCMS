import { Module, OnModuleInit } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailActivation } from './entities/email-activation.entity';
import { EmailChange } from './entities/email-change.entity';
import { EmailMessage } from './entities/email-message.entity';
import { PasswordReset } from './entities/password-reset.entity';
import { EMAIL_TEMPLATES_V1 } from './templates/v1';
import { PasswordModule } from 'src/auth/password/password.module';

@Module({
  imports: [PasswordModule, TypeOrmModule.forFeature([EmailMessage, EmailActivation, EmailChange, User, PasswordReset, RefreshToken])],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule implements OnModuleInit {
  constructor(@InjectRepository(EmailMessage) private emailMessagesRepository: Repository<EmailMessage>) {}

  async onModuleInit() {
    await this.emailMessagesRepository
      .createQueryBuilder()
      .insert()
      .into(EmailMessage)
      .values(EMAIL_TEMPLATES_V1)
      .orIgnore()
      .execute();
  }
}
