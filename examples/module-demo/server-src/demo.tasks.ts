import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { core, SafeCron } from 'unicore-api/server'
import { DemoNote } from './entities/note.entity'

@Injectable()
export class DemoTasks {
  constructor(@InjectRepository(DemoNote) private readonly notes: Repository<DemoNote>) {}

  @SafeCron('0 3 * * *', 'Очистка старых заметок демо-модуля')
  async cleanup(): Promise<void> {
    const border = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    await this.notes.createQueryBuilder().delete().where('created < :border', { border }).execute()
  }
}
