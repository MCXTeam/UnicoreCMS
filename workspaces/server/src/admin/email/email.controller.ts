import { Body, Controller, Get, NotFoundException, Param, ParseEnumPipe, Patch, Post } from '@nestjs/common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { EmailInput } from './dto/email.input';
import { TestEmailInput } from './dto/test-email.input';
import { EmailService } from './email.service';
import { EmailMessageType } from './enums/email-message-type.enum';

@Permissions(['panel.access'])
@Controller('admin/email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Permissions(['panel.email.read'])
  @Get()
  find() {
    return this.emailService.find();
  }

  @Permissions(['panel.email.read'])
  @Get(':id')
  async findOne(@Param('id', new ParseEnumPipe(EmailMessageType)) id: EmailMessageType) {
    const message = await this.emailService.findOne(id);

    if (!message) {
      throw new NotFoundException();
    }

    return message;
  }

  @Permissions(['panel.email.update'])
  @Patch(':id')
  update(@Param('id', new ParseEnumPipe(EmailMessageType)) id: EmailMessageType, @Body() body: EmailInput) {
    return this.emailService.update(id, body);
  }

  @Permissions(['panel.email.test'])
  @Post('test')
  test(@Body() body: TestEmailInput) {
    return this.emailService.test(body);
  }
}
