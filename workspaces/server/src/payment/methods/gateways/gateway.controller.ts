import { Body, Controller, Get, HttpCode, Param, Post, RawBodyRequest, Req, Res, UseInterceptors } from '@nestjs/common';
import { NoFilesInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { randomBytes } from 'node:crypto';
import { Permissions } from '../../../admin/roles/decorators/permission.decorator';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { Public } from '../../../auth/decorators/public.decorator';
import { User } from '../../../admin/users/entities/user.entity';
import { IpAddress } from '../../../common/decorators/IpAddress.decorator';
import { PaymentCreateDto } from '../core/dto/payment-create.dto';
import { GatewayService, GATEWAY_IDS } from './gateway.service';

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function createGatewayController(method: string) {
@Controller(`payment/methods/${method}`)
class GatewayController {
  constructor(private gateways: GatewayService) {}

  @Permissions(['player.payment'])
  @Post('link')
  create(@CurrentUser() user: User, @Body() body: PaymentCreateDto, @IpAddress() ip: string) {
    return this.gateways.create(method, body.amount, user, ip);
  }

  @Public()
  @HttpCode(200)
  @UseInterceptors(NoFilesInterceptor({ limits: { fields: 100, fieldSize: 8192 } }))
  @Post('handler')
  async handler(@Req() request: RawBodyRequest<Request>, @IpAddress() ip: string) {
    const headers = Object.fromEntries(Object.entries(request.headers).filter(([, value]) => typeof value === 'string')) as Record<string, string>;
    return this.gateways.notification(method, { body: request.body, raw: request.rawBody || Buffer.alloc(0), headers, ip });
  }

  @Public()
  @Get('resume/:token')
  async resume(@Param('token') token: string, @Res() response: Response) {
    response.setHeader('Cache-Control', 'no-store');
    response.redirect(303, await this.gateways.resume(method, token));
  }

  @Public()
  @Get('checkout/:token')
  async checkout(@Param('token') token: string, @Res() response: Response) {
    const form = await this.gateways.form(method, token);
    const nonce = randomBytes(24).toString('base64');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'nonce-${nonce}'; form-action ${new URL(form.action).origin}; base-uri 'none'; frame-ancestors 'none'`);
    const fields = Object.entries(form.fields).map(([key, value]) => `<input type="hidden" name="${escape(key)}" value="${escape(value)}">`).join('');
    response.type('html').send(`<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Оплата</title><form method="post" accept-charset="UTF-8" action="${escape(form.action)}">${fields}<button type="submit">Перейти к оплате</button></form><script nonce="${nonce}">document.querySelector('form').submit()</script></html>`);
  }
}

return GatewayController;
}

export const GATEWAY_CONTROLLERS = GATEWAY_IDS.map(createGatewayController);
