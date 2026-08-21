import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DemoChannel } from './demo.channel'
import { DemoController } from './demo.controller'
import { DemoTasks } from './demo.tasks'
import { DemoUploadController } from './demo.upload.controller'
import { DemoService } from './demo.service'
import { DemoNote } from './entities/note.entity'

@Module({
  imports: [TypeOrmModule.forFeature([DemoNote])],
  controllers: [DemoController, DemoUploadController],
  providers: [DemoService, DemoTasks, DemoChannel],
  exports: [DemoChannel],
})
export class DemoModule {}
