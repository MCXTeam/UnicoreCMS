import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './entities/page.entity';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';

@Module({
  imports: [TypeOrmModule.forFeature([Page])],
  providers: [PagesService],
  controllers: [PagesController],
})
export class PagesModule implements OnModuleInit {
  constructor(private pagesService: PagesService) {}

  async onModuleInit() {
    await this.pagesService.generate();
  }
}
