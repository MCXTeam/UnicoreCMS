import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Layout } from './entities/layout.entity';
import { LayoutController } from './layout.controller';
import { LayoutService } from './layout.service';

@Module({
  imports: [TypeOrmModule.forFeature([Layout])],
  providers: [LayoutService],
  controllers: [LayoutController],
  exports: [LayoutService],
})
export class LayoutModule {}
