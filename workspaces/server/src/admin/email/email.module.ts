import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';
import { EmailActivation } from './entities/email-activation.entity';
import { EmailMessage } from './entities/email-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EmailMessage, EmailActivation, User])],
  providers: [EmailService],
  controllers: [EmailController],
  exports: [EmailService],
})
export class EmailModule implements OnModuleInit {
  constructor(private emailService: EmailService) {}

  async onModuleInit() {
    await this.emailService.generate();
  }
}
