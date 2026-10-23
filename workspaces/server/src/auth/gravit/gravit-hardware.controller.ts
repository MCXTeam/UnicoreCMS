import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { UsersService } from 'src/admin/users/users.service';
import { HardwareService } from '../hardware/hardware.service';
import { HardwareAddKeyRequest, HardwareConnectRequest, HardwareCreateRequest, HardwareIdRequest, HardwareInfoRequest, HardwarePublicKeyRequest, HardwareReferenceRequest } from '../hardware/dto/hardware.input';
import { GravitUserDto } from './dto/gravit-user.dto';

@Permissions(['kernel.provider'])
@Controller('auth/gravit/hardware')
export class GravitHardwareController {
  constructor(private hardware: HardwareService, private users: UsersService) {}

  private reply(value: unknown, response: Response) { if (value == null) response.status(204); return value; }

  @Post('by-key') @HttpCode(200)
  async byKey(@Body() input: HardwarePublicKeyRequest, @Res({ passthrough: true }) response: Response) { return this.reply(await this.hardware.byKey(input.publicKey), response); }

  @Post('by-data') @HttpCode(200)
  async byData(@Body() input: HardwareInfoRequest, @Res({ passthrough: true }) response: Response) { return this.reply(await this.hardware.byData(input.info), response); }

  @Post('by-id') @HttpCode(200)
  async byId(@Body() input: HardwareIdRequest, @Res({ passthrough: true }) response: Response) { return this.reply(await this.hardware.byId(input.id), response); }

  @Post('create') @HttpCode(200)
  create(@Body() input: HardwareCreateRequest) { return this.hardware.create(input.info, input.publicKey); }

  @Post('connect') @HttpCode(200)
  connect(@Body() input: HardwareConnectRequest) { return this.hardware.connect(input.sessionID, input.hardware.id); }

  @Post('add-key') @HttpCode(200)
  addKey(@Body() input: HardwareAddKeyRequest) { return this.hardware.addKey(input.hardware.id, input.publicKey); }

  @Post('users') @HttpCode(200)
  async relatedUsers(@Body() input: HardwareReferenceRequest) {
    const uuids = await this.hardware.users(input.hardware.id);
    return Promise.all(uuids.map(async (uuid) => new GravitUserDto(await this.users.getById(uuid))));
  }

  @Post('ban') @HttpCode(200)
  ban(@Body() input: HardwareReferenceRequest, @Req() request: any) { return this.hardware.launcherBan(input.hardware.id, false, request); }

  @Post('unban') @HttpCode(200)
  unban(@Body() input: HardwareReferenceRequest, @Req() request: any) { return this.hardware.launcherBan(input.hardware.id, true, request); }
}
