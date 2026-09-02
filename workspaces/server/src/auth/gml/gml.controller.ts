import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { IpAddress, THROTTLE_LOGIN, ThrottlerCoreGuard } from '@common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator';
import { GmlAuthResultDto } from './dto/gml-auth-result.dto';
import { GmlLoginInput } from './dto/gml-login.input';
import { GmlService } from './gml.service';

@Public()
@UseGuards(ThrottlerCoreGuard)
@Controller('auth/gml')
export class GmlController {
  constructor(private gmlService: GmlService) {}

  @Throttle({ default: THROTTLE_LOGIN })
  @Post('login')
  login(@Body() input: GmlLoginInput, @IpAddress() ip: string): Promise<GmlAuthResultDto> {
    return this.gmlService.login(input, ip);
  }
}
