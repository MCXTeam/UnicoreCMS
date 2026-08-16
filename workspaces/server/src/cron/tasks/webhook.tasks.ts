import { SafeCron } from '@common';
import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { WebhookDeliveriesService } from 'src/admin/webhook/webhook-deliveries.service';

@Injectable()
export class WebhookTasks {
  constructor(private deliveriesService: WebhookDeliveriesService) {}

  @SafeCron(CronExpression.EVERY_10_SECONDS, 'webhook-deliveries')
  async process() {
    await this.deliveriesService.process();
  }

  @SafeCron(CronExpression.EVERY_DAY_AT_MIDNIGHT, 'webhook-deliveries-cleanup')
  async clean() {
    await this.deliveriesService.cleanup();
  }
}
