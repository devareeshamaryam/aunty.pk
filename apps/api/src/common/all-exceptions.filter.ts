import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp
      ? (exception as HttpException).getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = isHttp ? (exception as HttpException).getResponse() : null;

    let message: string | string[];
    if (typeof rawResponse === 'string') {
      message = rawResponse;
    } else if (rawResponse && typeof rawResponse === 'object') {
      message = (rawResponse as any).message ?? 'Error';
    } else {
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : (exception as Error)?.message || 'Internal server error';
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status}`,
        (exception as Error)?.stack,
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} -> ${status} ${JSON.stringify(message)}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
