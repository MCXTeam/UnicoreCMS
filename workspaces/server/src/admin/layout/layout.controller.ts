import { BadRequestException, Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { isLayoutPlace, LayoutState } from 'unicore-common';
import { Permissions } from '../roles/decorators/permission.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { LayoutInput } from './dto/layout.input';
import { LayoutService } from './layout.service';

@Controller()
export class LayoutController {
  constructor(private layoutService: LayoutService) {}

  @Public()
  @Get('layouts')
  state(): Promise<LayoutState> {
    return this.layoutService.state();
  }

  @Permissions(['panel.access', 'panel.layout.read'])
  @Get('admin/layouts')
  adminState(): Promise<LayoutState> {
    return this.layoutService.state();
  }

  @Permissions(['panel.access', 'panel.layout.update'])
  @Patch('admin/layouts/:place')
  update(@Req() request: any, @Param('place') place: string, @Body() body: LayoutInput) {
    if (!isLayoutPlace(place)) throw new BadRequestException('Неизвестная часть страницы');

    return this.layoutService.update(place, body, request);
  }
}
