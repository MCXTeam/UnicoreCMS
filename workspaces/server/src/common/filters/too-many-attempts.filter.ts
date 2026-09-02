import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { RETRY_AFTER_HEADER } from '../constants';
import { TooManyAttemptsException } from '../exceptions/too-many-attempts.exception';

@Catch(TooManyAttemptsException)
export class TooManyAttemptsFilter implements ExceptionFilter {
  catch(exception: TooManyAttemptsException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();

    response.setHeader(RETRY_AFTER_HEADER, String(exception.retryAfter));
    response.status(exception.getStatus()).json(exception.getResponse());
  }
}
