import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PeriodInput } from './dto/period.input';
import { Period } from './entities/period.entity';
import { PeriodsService } from './periods.service';

@Controller('donates/periods')
export class PeriodsController {
  constructor(private periodsService: PeriodsService) {}

  @Get()
  findAll(): Promise<Period[]> {
    return this.periodsService.find();
  }

  @Post()
  create(@Body() body: PeriodInput) {
    return this.periodsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() body: PeriodInput) {
    return this.periodsService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.periodsService.remove(id);
  }
}
