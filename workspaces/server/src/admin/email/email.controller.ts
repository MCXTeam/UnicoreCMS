import { Body, Controller, Get, NotFoundException, Param, ParseEnumPipe, Patch, Post } from '@nestjs/common';
import { Permission } from 'unicore-common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { EmailInput } from './dto/email.input';
import { TestEmailInput } from './dto/test-email.input';
import { EmailService } from './email.service';
import { EmailMessageType } from './enums/email-message-type.enum';

@Permissions([Permission.AdminDashboard])
@Controller('admin/email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Permissions([Permission.AdminEmailRead])
  @Get()
  find() {
    return this.emailService.find();
  }

  @Permissions([Permission.AdminEmailRead])
  @Get(':id')
  async findOne(@Param('id', new ParseEnumPipe(EmailMessageType)) id: EmailMessageType) {
    const message = await this.emailService.findOne(id);

    if (!message) {
      throw new NotFoundException();
    }

    return message;
  }

  @Permissions([Permission.AdminEmailUpdate])
  @Patch(':id')
  update(@Param('id', new ParseEnumPipe(EmailMessageType)) id: EmailMessageType, @Body() body: EmailInput) {
    return this.emailService.update(id, body);
  }

  @Permissions([Permission.AdminEmailTest])
  @Post('test')
  test(@Body() body: TestEmailInput) {
    return this.emailService.test(body);
  }
}
