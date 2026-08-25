import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { isRconConfigKey, Permission } from 'unicore-common';
import { Public } from 'src/auth/decorators/public.decorator';
import { RuntimePermissions } from '../roles/decorators/permission.decorator';
import { matchPermission } from '../roles/guards/permisson.guard';
import { ConfigService } from './config.service';
import { ConfigInput } from './dto/config.input';

@RuntimePermissions()
@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  private superuser(request: any): boolean {
    return Boolean(request?.user?.superuser);
  }

  private async rconOnly(request: any): Promise<boolean> {
    if (this.superuser(request)) return false;

    if (await matchPermission([Permission.AdminServersRcon], request)) return true;

    throw new ForbiddenException();
  }

  @Public()
  @Get('/public')
  findPublic() {
    return this.configService.findPublic();
  }

  @Get()
  async find(@Req() request: any) {
    const limited = await this.rconOnly(request);
    const config = await this.configService.find();

    return limited ? config.filter((item) => isRconConfigKey(item.key)) : config;
  }

  @Patch()
  async update(@Req() request: any, @Body() body: ConfigInput) {
    if ((await this.rconOnly(request)) && !isRconConfigKey(body.key)) throw new ForbiddenException();

    return this.configService.update(body);
  }

  @Delete(':key')
  async delete(@Req() request: any, @Param('key') key: string) {
    if (!this.superuser(request)) throw new ForbiddenException();

    return this.configService.delate(key);
  }

  @Post()
  async create(@Req() request: any, @Body() body: ConfigInput) {
    if (!this.superuser(request)) throw new ForbiddenException();

    return this.configService.create(body);
  }
}
