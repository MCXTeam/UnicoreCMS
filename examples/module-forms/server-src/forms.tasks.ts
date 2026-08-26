import { Injectable } from '@nestjs/common'
import { SafeCron, core } from 'unicore-api/server'
import { FormsService } from './forms.service'

@Injectable()
export class FormsTasks {
  constructor(private readonly forms: FormsService) {}

  @SafeCron('0 4 * * *', 'Очистка рассмотренных заявок')
  async cleanup(): Promise<void> {
    const days = await core().config.getNumber('mod_forms_keep_days', 0)
    const removed = await this.forms.cleanup(days)

    if (removed) core().logger('forms').log(`Удалено рассмотренных заявок: ${removed}`)
  }
}
