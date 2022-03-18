import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from 'src/admin/roles/decorators/permission.decorator';
import { Permission } from 'unicore-common';
import { PeriodInput } from './dto/period.input';
import { Period } from './entities/period.entity';
import { PeriodsService } from './periods.service';

@Permissions([Permission.AdminDashboard])
@Controller('donates/periods')
export class PeriodsController {
  constructor(private periodsService: PeriodsService) {}

  @Permissions([Permission.EditorDonateRead])
  @Get()
  findAll(): Promise<Period[]> {
    return this.periodsService.find();
  }

  @Permissions([Permission.EditorDonatePeriodsCreate])
  @Post()
  create(@Body() body: PeriodInput) {
    return this.periodsService.create(body);
  }

  @Permissions([Permission.EditorDonatePeriodsUpdate])
  @Patch(':id')
  update(@Param('id') id: number, @Body() body: PeriodInput) {
    return this.periodsService.update(id, body);
  }

  @Permissions([Permission.EditorDonatePeriodsDelete])
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.periodsService.remove(id);
  }
}
