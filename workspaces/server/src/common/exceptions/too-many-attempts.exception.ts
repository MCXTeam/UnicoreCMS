import { HttpException, HttpStatus } from '@nestjs/common';
import { TOO_MANY_ATTEMPTS_MESSAGE } from '../constants';

export class TooManyAttemptsException extends HttpException {
  constructor(readonly retryAfter: number) {
    super({ statusCode: HttpStatus.TOO_MANY_REQUESTS, message: TOO_MANY_ATTEMPTS_MESSAGE }, HttpStatus.TOO_MANY_REQUESTS);
  }
}
