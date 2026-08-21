import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { SuperUserGuard } from 'src/admin/roles/guards/superuser.guard';
import { ThemeActiveInput } from './dto/theme-active.input';
import { ThemesService } from './themes.service';

@Controller('admin/themes')
@UseGuards(SuperUserGuard)
export class ThemesController {
  constructor(private readonly service: ThemesService) {}

  @Get()
  find() {
    return this.service.find();
  }

  @Put('active')
  setActive(@Body() input: ThemeActiveInput) {
    return this.service.setActive(input.id, input.side);
  }
}
