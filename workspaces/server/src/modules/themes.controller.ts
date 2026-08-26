import { Body, Controller, Get, Put } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { ThemeActiveInput } from './dto/theme-active.input';
import { ThemesService } from './themes.service';

@Controller('admin/themes')
@Permissions(['panel.extensions.read'])
export class ThemesController {
  constructor(private readonly service: ThemesService) {}

  @Get()
  find() {
    return this.service.find();
  }

  @Permissions(['panel.extensions.manage'])
  @Put('active')
  setActive(@Body() input: ThemeActiveInput) {
    return this.service.setActive(input.id, input.side);
  }
}
