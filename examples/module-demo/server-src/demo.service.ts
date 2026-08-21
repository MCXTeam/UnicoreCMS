import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { core } from 'unicore-api'
import { DemoNote } from './entities/note.entity'

@Injectable()
export class DemoService {
  constructor(@InjectRepository(DemoNote) private readonly notes: Repository<DemoNote>) {}

  async list(): Promise<{ greeting: string; notes: DemoNote[] }> {
    const greeting = (await core().config.get('public_mod_demo_greeting')) || 'Привет'
    const limit = await core().config.getNumber('mod_demo_limit', 10)

    return { greeting, notes: await this.notes.find({ order: { id: 'DESC' }, take: limit }) }
  }

  create(uuid: string | null, text: string): Promise<DemoNote> {
    return this.notes.save(this.notes.create({ uuid: uuid || null, text }))
  }
}
