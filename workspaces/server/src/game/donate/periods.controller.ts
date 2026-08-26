import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { PeriodInput } from './dto/period.input';
import { Period } from './entities/period.entity';
import { PeriodsService } from './periods.service';

@Permissions(['panel.access'])
@Controller('donates/periods')
export class PeriodsController {
  constructor(private periodsService: PeriodsService) {}

  @Permissions([
    ['panel.donate.read', 'panel.users.donate', 'panel.users.donate.*'],
    { or: true },
  ])
  @Get()
  findAll(): Promise<Period[]> {
    return this.periodsService.find();
  }

  @Permissions(['panel.donate.periods.create'])
  @Post()
  create(@Body() body: PeriodInput) {
    return this.periodsService.create(body);
  }

  @Permissions(['panel.donate.periods.update'])
  @Patch(':id')
  update(@Param('id') id: number, @Body() body: PeriodInput) {
    return this.periodsService.update(id, body);
  }

  @Permissions(['panel.donate.periods.delete'])
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.periodsService.remove(id);
  }
}
