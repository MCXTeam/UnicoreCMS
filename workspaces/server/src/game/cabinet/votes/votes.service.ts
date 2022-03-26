import { Injectable } from '@nestjs/common';

@Injectable()
export class VotesService {
  private monitorings: string[] = new Array()

  async getMonitorings() {
    return this.monitorings
  }

  async setMonitorings(monitorings: string[]) {
    this.monitorings = monitorings
  }
}
