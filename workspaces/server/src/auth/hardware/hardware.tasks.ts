import { Injectable } from '@nestjs/common';
import { DataSource, LessThan } from 'typeorm';
import { SafeCron } from '@common';
import { HardwareJoin } from './entities/hardware.entity';

@Injectable()
export class HardwareTasks {
  constructor(private dataSource: DataSource) {}

  @SafeCron('0 */5 * * * *', 'hardware-join-cleanup')
  async cleanJoins() { await this.dataSource.getRepository(HardwareJoin).delete({ expiresAt: LessThan(new Date()) }); }
}
