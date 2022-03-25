import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentService {
  private methods: string[] = new Array()

  async getMethods() {
    return this.methods
  }

  async setMethods(methods: string[]) {
    this.methods = methods
  }
}
